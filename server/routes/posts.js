const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      featured, 
      limit = 20, 
      page = 1,
      sort = 'newest'
    } = req.query;

    let query = { status: 'published', isApproved: true };

    if (type) query.type = type;
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { 'engagement.likes': -1 };
        break;
      case 'trending':
        sortOption = { 'analytics.engagement': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'name avatar startup')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar startup bio')
      .populate('engagement.comments.userId', 'name avatar');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    post.incrementViews();

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', [
  auth,
  body('title', 'Title is required').not().isEmpty(),
  body('content', 'Content is required').not().isEmpty(),
  body('type', 'Type must be valid').isIn(['fail_forward', 'signal_boost', 'investor_connect', 'general']),
  body('category', 'Category must be valid').isIn(['tech', 'health', 'finance', 'education', 'ecommerce', 'ai', 'sustainability', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      content,
      type,
      category,
      tags,
      media,
      failure,
      signal,
      investor
    } = req.body;

    const post = new Post({
      author: req.user.id,
      title,
      content,
      type,
      category,
      tags: tags || [],
      media: media || [],
      failure: type === 'fail_forward' ? failure : undefined,
      signal: type === 'signal_boost' ? signal : undefined,
      investor: type === 'investor_connect' ? investor : undefined
    });

    await post.save();

    // Add F-Coins for posting
    const user = await User.findById(req.user.id);
    let coinAmount = 10; // Base amount for posting
    
    if (type === 'signal_boost') {
      coinAmount = 20; // More coins for signal boosts
    } else if (type === 'fail_forward') {
      coinAmount = 15; // Coins for sharing failures
    }

    await user.addFCoins(coinAmount, 'post_created', `Created ${type} post`);

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name avatar startup');

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allowedUpdates = [
      'title', 'content', 'category', 'tags', 'media',
      'failure', 'signal', 'investor'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name avatar startup');

    res.json(updatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author or admin
    const user = await User.findById(req.user.id);
    if (post.author.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    post.status = 'deleted';
    await post.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = post.engagement.likes.find(
      like => like.userId.toString() === req.user.id
    );

    if (existingLike) {
      // Unlike
      await post.removeLike(req.user.id);
      res.json({ message: 'Post unliked', liked: false });
    } else {
      // Like
      await post.addLike(req.user.id);
      
      // Add F-Coins to author for getting a like
      const author = await User.findById(post.author);
      await author.addFCoins(1, 'post_liked', 'Post received a like');
      
      res.json({ message: 'Post liked', liked: true });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/:id/comment', [
  auth,
  body('content', 'Comment content is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await post.addComment(req.user.id, content);

    // Add F-Coins to author for getting a comment
    const author = await User.findById(post.author);
    await author.addFCoins(2, 'post_commented', 'Post received a comment');

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name avatar startup')
      .populate('engagement.comments.userId', 'name avatar');

    res.json(updatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/share
// @desc    Share a post
// @access  Private
router.post('/:id/share', [
  auth,
  body('platform', 'Platform is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await post.addShare(req.user.id, platform);

    // Add F-Coins to author for getting a share
    const author = await User.findById(post.author);
    await author.addFCoins(3, 'post_shared', 'Post was shared');

    res.json({ message: 'Post shared successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts/user/posts
// @desc    Get posts by current user
// @access  Private
router.get('/user/posts', auth, async (req, res) => {
  try {
    const posts = await Post.find({ 
      author: req.user.id,
      status: { $ne: 'deleted' }
    })
    .populate('author', 'name avatar startup')
    .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts/user/liked
// @desc    Get posts liked by current user
// @access  Private
router.get('/user/liked', auth, async (req, res) => {
  try {
    const posts = await Post.find({
      'engagement.likes.userId': req.user.id,
      status: 'published',
      isApproved: true
    })
    .populate('author', 'name avatar startup')
    .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 