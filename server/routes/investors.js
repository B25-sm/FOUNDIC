const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/investors/dashboard
// @desc    Get investor dashboard
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'investor') {
      return res.status(403).json({ error: 'Only investors can access investor dashboard' });
    }

    // Get verified founders ranked by F-Coins
    const founders = await User.find({
      role: 'founder',
      isVerified: true,
      isActive: true,
      isBanned: false
    })
    .select('name avatar startup fCoins bio')
    .sort({ fCoins: -1 })
    .limit(20);

    // Get recent investor connect posts
    const recentPosts = await Post.find({
      type: 'investor_connect',
      status: 'published',
      isApproved: true
    })
    .populate('author', 'name avatar startup')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get investor's portfolio
    const portfolio = await getInvestorPortfolio(req.user.id);

    res.json({
      user: user.getPublicProfile(),
      founders,
      recentPosts,
      portfolio
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/investors/founders
// @desc    Get filtered founders for investment
// @access  Private
router.get('/founders', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'investor') {
      return res.status(403).json({ error: 'Only investors can access founder list' });
    }

    const { 
      stage, 
      category, 
      minCoins, 
      verified, 
      limit = 20, 
      page = 1 
    } = req.query;

    let query = {
      role: 'founder',
      isActive: true,
      isBanned: false
    };

    if (stage) query['startup.stage'] = stage;
    if (category) query['startup.category'] = category;
    if (minCoins) query.fCoins = { $gte: parseInt(minCoins) };
    if (verified === 'true') query.isVerified = true;

    const founders = await User.find(query)
      .select('name avatar startup fCoins bio skills location')
      .sort({ fCoins: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      founders,
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

// @route   GET /api/investors/founders/:id
// @desc    Get detailed founder profile for investment
// @access  Private
router.get('/founders/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'investor') {
      return res.status(403).json({ error: 'Only investors can access founder details' });
    }

    const founder = await User.findById(req.params.id);
    if (!founder || founder.role !== 'founder') {
      return res.status(404).json({ error: 'Founder not found' });
    }

    // Get founder's posts
    const posts = await Post.find({
      author: req.params.id,
      status: 'published',
      isApproved: true
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // Get founder's pods
    const pods = await getFounderPods(req.params.id);

    // Get founder's public compass data
    const compassData = await getFounderCompass(req.params.id);

    res.json({
      founder: founder.getPublicProfile(),
      posts,
      pods,
      compass: compassData
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Founder not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/investors/interest
// @desc    Express interest in a founder
// @access  Private
router.post('/interest', [
  auth,
  body('founderId', 'Founder ID is required').not().isEmpty(),
  body('message', 'Message is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'investor') {
      return res.status(403).json({ error: 'Only investors can express interest' });
    }

    const { founderId, message, investmentRange, focusAreas } = req.body;

    const founder = await User.findById(founderId);
    if (!founder || founder.role !== 'founder') {
      return res.status(404).json({ error: 'Founder not found' });
    }

    // Create interest post
    const post = new Post({
      author: req.user.id,
      title: `Investment Interest: ${founder.startup.name}`,
      content: message,
      type: 'investor_connect',
      category: founder.startup.category || 'other',
      investor: {
        stage: founder.startup.stage,
        traction: {
          users: founder.startup.users || 0,
          revenue: founder.startup.revenue || 0,
          teamSize: 1
        },
        funding: {
          amount: investmentRange?.max || 0,
          type: 'seed'
        }
      }
    });

    await post.save();

    // Add F-Coins to founder for investor interest
    await founder.addFCoins(25, 'investor_interest', 'Received investor interest');

    res.json({
      message: 'Interest expressed successfully',
      post
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/investors/profile
// @desc    Update investor profile
// @access  Private
router.put('/profile', [
  auth,
  body('investor.type', 'Investor type must be valid').isIn(['angel', 'vc', 'corporate', 'family_office']),
  body('investor.investmentRange.min', 'Minimum investment amount is required').isNumeric(),
  body('investor.investmentRange.max', 'Maximum investment amount is required').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'investor') {
      return res.status(403).json({ error: 'Only investors can update investor profile' });
    }

    const { investor } = req.body;

    user.investor = { ...user.investor, ...investor };
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/investors/analytics
// @desc    Get investor analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'investor') {
      return res.status(403).json({ error: 'Only investors can access analytics' });
    }

    const analytics = await getInvestorAnalytics(req.user.id);

    res.json(analytics);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to get investor portfolio
async function getInvestorPortfolio(investorId) {
  const portfolio = {
    totalInterests: 0,
    activeInterests: 0,
    successfulConnections: 0,
    totalInvested: 0,
    focusAreas: []
  };

  // Get investor's posts
  const posts = await Post.find({
    author: investorId,
    type: 'investor_connect'
  });

  portfolio.totalInterests = posts.length;
  portfolio.activeInterests = posts.filter(post => 
    post.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
  ).length;

  // Get investor's focus areas
  const user = await User.findById(investorId);
  if (user.investor && user.investor.focusAreas) {
    portfolio.focusAreas = user.investor.focusAreas;
  }

  return portfolio;
}

// Helper function to get founder pods
async function getFounderPods(founderId) {
  const Pod = require('../models/Pod');
  
  return await Pod.find({
    'members.userId': founderId,
    'members.status': 'active',
    isPublic: true
  })
  .populate('founder', 'name avatar')
  .sort({ createdAt: -1 })
  .limit(5);
}

// Helper function to get founder compass data
async function getFounderCompass(founderId) {
  const User = require('../models/User');
  const Pod = require('../models/Pod');
  const Post = require('../models/Post');

  const founder = await User.findById(founderId);
  const pods = await Pod.find({
    'members.userId': founderId,
    'members.status': 'active',
    isPublic: true
  });
  const posts = await Post.find({
    author: founderId,
    status: 'published',
    isApproved: true
  });

  return {
    stage: founder.startup.stage,
    fCoins: founder.fCoins,
    totalPods: pods.length,
    totalPosts: posts.length,
    isVerified: founder.isVerified
  };
}

// Helper function to get investor analytics
async function getInvestorAnalytics(investorId) {
  const analytics = {
    interests: {
      total: 0,
      thisMonth: 0,
      byStage: {}
    },
    engagement: {
      postsViewed: 0,
      foundersContacted: 0,
      responsesReceived: 0
    },
    portfolio: {
      totalValue: 0,
      activeInvestments: 0,
      returns: 0
    }
  };

  // Get investor's posts
  const posts = await Post.find({ author: investorId });
  analytics.interests.total = posts.length;
  
  const thisMonth = new Date();
  thisMonth.setMonth(thisMonth.getMonth() - 1);
  analytics.interests.thisMonth = posts.filter(post => 
    post.createdAt > thisMonth
  ).length;

  // Calculate engagement
  analytics.engagement.postsViewed = posts.length; // Simplified for now
  analytics.engagement.foundersContacted = new Set(
    posts.map(post => post.author.toString())
  ).size;

  return analytics;
}

module.exports = router; 