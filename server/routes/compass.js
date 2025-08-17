const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Pod = require('../models/Pod');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/compass/dashboard
// @desc    Get founder compass dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'founder') {
      return res.status(403).json({ error: 'Only founders can access compass dashboard' });
    }

    // Get user's pods
    const pods = await Pod.find({
      'members.userId': req.user.id,
      'members.status': 'active'
    }).populate('founder', 'name avatar');

    // Get user's posts
    const posts = await Post.find({
      author: req.user.id,
      status: 'published'
    }).sort({ createdAt: -1 }).limit(5);

    // Calculate progress metrics
    const progress = calculateProgress(user, pods, posts);

    // Get recent activity
    const recentActivity = await getRecentActivity(req.user.id);

    res.json({
      user: user.getPublicProfile(),
      progress,
      pods,
      posts,
      recentActivity
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/compass/update-stage
// @desc    Update startup stage
// @access  Private
router.put('/update-stage', [
  auth,
  body('stage', 'Stage must be valid').isIn(['idea', 'mvp', 'users', 'revenue', 'scaling'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { stage, milestone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'founder') {
      return res.status(403).json({ error: 'Only founders can update stage' });
    }

    const oldStage = user.startup.stage;
    user.startup.stage = stage;

    // Add F-Coins for stage progression
    let coinAmount = 0;
    const stageCoins = {
      mvp: 50,
      users: 100,
      revenue: 200,
      scaling: 500
    };

    if (stageCoins[stage] && oldStage !== stage) {
      coinAmount = stageCoins[stage];
      await user.addFCoins(coinAmount, 'stage_progression', `Advanced to ${stage} stage`);
    }

    await user.save();

    // Create milestone post if provided
    if (milestone) {
      const post = new Post({
        author: req.user.id,
        title: `Milestone: ${milestone}`,
        content: `Just reached ${stage} stage! ${milestone}`,
        type: 'signal_boost',
        category: user.startup.category || 'other',
        signal: {
          type: 'milestone',
          impact: 'medium'
        }
      });

      await post.save();
    }

    res.json({
      message: 'Stage updated successfully',
      user: user.getPublicProfile(),
      coinsEarned: coinAmount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/compass/analytics
// @desc    Get detailed analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'founder') {
      return res.status(403).json({ error: 'Only founders can access analytics' });
    }

    // Get analytics data
    const analytics = await getAnalytics(req.user.id);

    res.json(analytics);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/compass/public/:userId
// @desc    Get public compass data for a user
// @access  Public
router.get('/public/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== 'founder') {
      return res.status(404).json({ error: 'Founder not found' });
    }

    // Get public pods
    const pods = await Pod.find({
      'members.userId': req.params.userId,
      'members.status': 'active',
      isPublic: true
    }).populate('founder', 'name avatar');

    // Get public posts
    const posts = await Post.find({
      author: req.params.userId,
      status: 'published',
      isApproved: true
    }).sort({ createdAt: -1 }).limit(10);

    // Calculate public progress
    const progress = calculatePublicProgress(user, pods, posts);

    res.json({
      user: {
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        startup: user.startup,
        fCoins: user.fCoins,
        isVerified: user.isVerified
      },
      progress,
      pods: pods.length,
      posts: posts.length
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Founder not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to calculate progress
function calculateProgress(user, pods, posts) {
  const progress = {
    stage: user.startup.stage,
    stageProgress: 0,
    fCoins: user.fCoins,
    totalPods: pods.length,
    activePods: pods.filter(pod => pod.stage === 'active').length,
    completedPods: pods.filter(pod => pod.stage === 'completed').length,
    totalPosts: posts.length,
    engagement: 0,
    milestones: []
  };

  // Calculate stage progress
  const stageLevels = { idea: 0, mvp: 25, users: 50, revenue: 75, scaling: 100 };
  progress.stageProgress = stageLevels[user.startup.stage] || 0;

  // Calculate engagement
  let totalLikes = 0;
  let totalComments = 0;
  posts.forEach(post => {
    totalLikes += post.engagement.likes.length;
    totalComments += post.engagement.comments.length;
  });
  progress.engagement = totalLikes + (totalComments * 2);

  // Generate milestones
  progress.milestones = generateMilestones(user, pods, posts);

  return progress;
}

// Helper function to calculate public progress
function calculatePublicProgress(user, pods, posts) {
  return {
    stage: user.startup.stage,
    fCoins: user.fCoins,
    totalPods: pods.length,
    totalPosts: posts.length,
    isVerified: user.isVerified
  };
}

// Helper function to generate milestones
function generateMilestones(user, pods, posts) {
  const milestones = [];

  // Stage milestones
  if (user.startup.stage !== 'idea') {
    milestones.push({
      type: 'stage',
      title: `Reached ${user.startup.stage} stage`,
      description: `Advanced from idea to ${user.startup.stage}`,
      achieved: true,
      date: user.updatedAt
    });
  }

  // Pod milestones
  if (pods.length > 0) {
    milestones.push({
      type: 'pod',
      title: `Joined ${pods.length} pod${pods.length > 1 ? 's' : ''}`,
      description: `Actively participating in co-building sprints`,
      achieved: true,
      date: pods[0].createdAt
    });
  }

  // Post milestones
  if (posts.length >= 5) {
    milestones.push({
      type: 'post',
      title: 'Active community member',
      description: `Shared ${posts.length} posts with the community`,
      achieved: true,
      date: posts[4].createdAt
    });
  }

  // F-Coin milestones
  if (user.fCoins >= 100) {
    milestones.push({
      type: 'coins',
      title: 'F-Coin collector',
      description: `Earned ${user.fCoins} F-Coins through community engagement`,
      achieved: true,
      date: new Date()
    });
  }

  return milestones;
}

// Helper function to get recent activity
async function getRecentActivity(userId) {
  const activities = [];

  // Recent posts
  const recentPosts = await Post.find({ author: userId })
    .sort({ createdAt: -1 })
    .limit(3);

  recentPosts.forEach(post => {
    activities.push({
      type: 'post',
      title: post.title,
      date: post.createdAt,
      data: post
    });
  });

  // Recent pod activities
  const recentPods = await Pod.find({
    'members.userId': userId,
    'members.status': 'active'
  })
  .sort({ updatedAt: -1 })
  .limit(3);

  recentPods.forEach(pod => {
    activities.push({
      type: 'pod',
      title: pod.title,
      date: pod.updatedAt,
      data: pod
    });
  });

  // Sort by date
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  return activities.slice(0, 10);
}

// Helper function to get analytics
async function getAnalytics(userId) {
  const analytics = {
    posts: {
      total: 0,
      byType: {},
      engagement: 0
    },
    pods: {
      total: 0,
      active: 0,
      completed: 0,
      progress: 0
    },
    coins: {
      total: 0,
      history: []
    },
    growth: {
      monthly: []
    }
  };

  // Post analytics
  const posts = await Post.find({ author: userId });
  analytics.posts.total = posts.length;
  
  posts.forEach(post => {
    analytics.posts.byType[post.type] = (analytics.posts.byType[post.type] || 0) + 1;
    analytics.posts.engagement += post.engagement.likes.length + (post.engagement.comments.length * 2);
  });

  // Pod analytics
  const pods = await Pod.find({ 'members.userId': userId });
  analytics.pods.total = pods.length;
  analytics.pods.active = pods.filter(pod => pod.stage === 'active').length;
  analytics.pods.completed = pods.filter(pod => pod.stage === 'completed').length;
  
  if (pods.length > 0) {
    const totalProgress = pods.reduce((sum, pod) => sum + pod.progress.completionPercentage, 0);
    analytics.pods.progress = Math.round(totalProgress / pods.length);
  }

  // Coin analytics
  const user = await User.findById(userId);
  analytics.coins.total = user.fCoins;
  analytics.coins.history = user.coinHistory.slice(-10);

  return analytics;
}

module.exports = router; 