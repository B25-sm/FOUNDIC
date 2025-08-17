const express = require('express');
const { body, validationResult } = require('express-validator');
const Pod = require('../models/Pod');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/pods
// @desc    Get all pods with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      stage, 
      status, 
      featured, 
      limit = 20, 
      page = 1 
    } = req.query;

    let query = { isPublic: true, status: { $ne: 'draft' } };

    if (category) query.category = category;
    if (stage) query.stage = stage;
    if (status) query.status = status;
    if (featured === 'true') query.isFeatured = true;

    const pods = await Pod.find(query)
      .populate('founder', 'name avatar')
      .populate('members.userId', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Pod.countDocuments(query);

    res.json({
      pods,
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

// @route   GET /api/pods/:id
// @desc    Get pod by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const pod = await Pod.findById(req.params.id)
      .populate('founder', 'name avatar bio startup')
      .populate('members.userId', 'name avatar bio startup skills');

    if (!pod) {
      return res.status(404).json({ error: 'Pod not found' });
    }

    // Increment view count
    pod.metrics.views += 1;
    await pod.save();

    res.json(pod);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Pod not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/pods
// @desc    Create a new pod
// @access  Private
router.post('/', [
  auth,
  body('title', 'Title is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty(),
  body('category', 'Category is required').isIn(['tech', 'health', 'finance', 'education', 'ecommerce', 'ai', 'sustainability', 'other']),
  body('compensationModel', 'Compensation model is required').isIn(['equity', 'barter', 'rev_share', 'hybrid']),
  body('startDate', 'Start date is required').isISO8601(),
  body('endDate', 'End date is required').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      category,
      compensationModel,
      startDate,
      endDate,
      goals,
      tags,
      maxMembers
    } = req.body;

    const user = await User.findById(req.user.id);
    if (user.role !== 'founder') {
      return res.status(400).json({ error: 'Only founders can create pods' });
    }

    const pod = new Pod({
      title,
      description,
      founder: req.user.id,
      category,
      compensationModel,
      startDate,
      endDate,
      goals: goals || [],
      tags: tags || [],
      'applicationProcess.maxMembers': maxMembers || 10
    });

    // Add founder as first member
    await pod.addMember(req.user.id, 'founder', 'equity', 60);

    await pod.save();

    const populatedPod = await Pod.findById(pod._id)
      .populate('founder', 'name avatar')
      .populate('members.userId', 'name avatar');

    res.json(populatedPod);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/pods/:id
// @desc    Update pod
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) {
      return res.status(404).json({ error: 'Pod not found' });
    }

    // Check if user is the founder
    if (pod.founder.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allowedUpdates = [
      'title', 'description', 'category', 'goals', 'tags',
      'communication', 'isPublic', 'status', 'applicationProcess'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        pod[field] = req.body[field];
      }
    });

    await pod.save();

    const updatedPod = await Pod.findById(pod._id)
      .populate('founder', 'name avatar')
      .populate('members.userId', 'name avatar');

    res.json(updatedPod);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/pods/:id/apply
// @desc    Apply to join a pod
// @access  Private
router.post('/:id/apply', [
  auth,
  body('role', 'Role is required').isIn(['co-founder', 'developer', 'designer', 'marketer', 'mentor', 'investor']),
  body('contribution', 'Contribution type is required').isIn(['equity', 'barter', 'rev_share', 'volunteer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, contribution, equityPercentage = 0, message } = req.body;

    const pod = await Pod.findById(req.params.id);
    if (!pod) {
      return res.status(404).json({ error: 'Pod not found' });
    }

    if (pod.status !== 'open') {
      return res.status(400).json({ error: 'Pod is not accepting applications' });
    }

    // Check if user is already a member
    const isMember = pod.members.find(
      member => member.userId.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({ error: 'Already a member of this pod' });
    }

    // Check if pod is full
    const activeMembers = pod.members.filter(m => m.status === 'active').length;
    if (activeMembers >= pod.applicationProcess.maxMembers) {
      return res.status(400).json({ error: 'Pod is full' });
    }

    // Add member
    await pod.addMember(req.user.id, role, contribution, equityPercentage);

    // Increment application count
    pod.metrics.applications += 1;
    await pod.save();

    res.json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/pods/:id/goals/:goalId
// @desc    Update goal status
// @access  Private
router.put('/:id/goals/:goalId', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const pod = await Pod.findById(req.params.id);
    if (!pod) {
      return res.status(404).json({ error: 'Pod not found' });
    }

    // Check if user is a member
    const isMember = pod.members.find(
      member => member.userId.toString() === req.user.id && member.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const goal = pod.goals.id(req.params.goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    goal.status = status;
    if (status === 'completed') {
      goal.completedAt = new Date();
    }

    await pod.updateProgress();
    await pod.save();

    res.json(pod);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/pods/user/joined
// @desc    Get pods joined by current user
// @access  Private
router.get('/user/joined', auth, async (req, res) => {
  try {
    const pods = await Pod.find({
      'members.userId': req.user.id,
      'members.status': 'active'
    })
    .populate('founder', 'name avatar')
    .populate('members.userId', 'name avatar')
    .sort({ createdAt: -1 });

    res.json(pods);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/pods/user/created
// @desc    Get pods created by current user
// @access  Private
router.get('/user/created', auth, async (req, res) => {
  try {
    const pods = await Pod.find({ founder: req.user.id })
      .populate('founder', 'name avatar')
      .populate('members.userId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(pods);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 