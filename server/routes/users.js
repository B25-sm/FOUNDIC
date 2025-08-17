const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name', 'Name is required').not().isEmpty(),
  body('bio', 'Bio must be less than 500 characters').isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, bio, location, skills, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.location = location || user.location;
    user.skills = skills || user.skills;
    user.avatar = avatar || user.avatar;

    await user.save();

    res.json(user.getPublicProfile());
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/startup
// @desc    Update startup information
// @access  Private
router.put('/startup', [
  auth,
  body('startup.name', 'Startup name is required').not().isEmpty(),
  body('startup.stage', 'Stage must be valid').isIn(['idea', 'mvp', 'users', 'revenue', 'scaling'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startup } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'founder') {
      return res.status(400).json({ error: 'Only founders can update startup information' });
    }

    // Update startup fields
    user.startup = { ...user.startup, ...startup };

    await user.save();

    res.json(user.getPublicProfile());
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/mindset
// @desc    Update mindset preferences for DNA matching
// @access  Private
router.put('/mindset', [
  auth,
  body('mindset.riskTolerance', 'Risk tolerance must be valid').isIn(['conservative', 'moderate', 'aggressive']),
  body('mindset.workStyle', 'Work style must be valid').isIn(['structured', 'flexible', 'hybrid']),
  body('mindset.communication', 'Communication style must be valid').isIn(['direct', 'diplomatic', 'collaborative'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mindset } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update mindset fields
    user.mindset = { ...user.mindset, ...mindset };

    await user.save();

    res.json(user.getPublicProfile());
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/leaders
// @desc    Get leaderboard of founders by F-Coins
// @access  Public
router.get('/leaders', async (req, res) => {
  try {
    const { limit = 10, role = 'founder' } = req.query;

    const users = await User.find({ 
      role, 
      isActive: true,
      isBanned: false 
    })
    .select('name avatar fCoins startup bio')
    .sort({ fCoins: -1 })
    .limit(parseInt(limit));

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by name, skills, or startup
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, role, skills, stage } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    let query = { isActive: true, isBanned: false };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'startup.name': { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (skills) {
      query.skills = { $in: skills.split(',') };
    }

    if (stage) {
      query['startup.stage'] = stage;
    }

    const users = await User.find(query)
      .select('name avatar bio startup skills fCoins')
      .limit(limit);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -notifications -connections');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/connect
// @desc    Send connection request
// @access  Private
router.post('/connect', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(req.user.id);

    // Check if connection already exists
    const existingConnection = currentUser.connections.find(
      conn => conn.userId.toString() === userId
    );

    if (existingConnection) {
      return res.status(400).json({ error: 'Connection request already sent' });
    }

    // Add connection request
    currentUser.connections.push({
      userId,
      status: 'pending'
    });

    await currentUser.save();

    res.json({ message: 'Connection request sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/connect/:id
// @desc    Accept or reject connection request
// @access  Private
router.put('/connect/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await User.findById(req.user.id);
    const connection = user.connections.find(
      conn => conn.userId.toString() === req.params.id
    );

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    connection.status = status;
    await user.save();

    res.json({ message: `Connection ${status}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 