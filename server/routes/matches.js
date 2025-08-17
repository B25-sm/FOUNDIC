const express = require('express');
const { body, validationResult } = require('express-validator');
const Match = require('../models/Match');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/matches
// @desc    Get matches for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, quality, limit = 20, page = 1 } = req.query;

    let query = {
      $or: [
        { founder1: req.user.id },
        { founder2: req.user.id }
      ]
    };

    if (status) query.status = status;
    if (quality) query.quality = quality;

    const matches = await Match.find(query)
      .populate('founder1', 'name avatar startup bio skills')
      .populate('founder2', 'name avatar startup bio skills')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Match.countDocuments(query);

    res.json({
      matches,
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

// @route   GET /api/matches/:id
// @desc    Get match by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('founder1', 'name avatar startup bio skills mindset')
      .populate('founder2', 'name avatar startup bio skills mindset')
      .populate('messages.sender', 'name avatar');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is part of this match
    if (match.founder1.toString() !== req.user.id && match.founder2.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(match);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/matches/generate
// @desc    Generate new matches for current user
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find potential matches
    const potentialMatches = await User.find({
      _id: { $ne: req.user.id },
      role: 'founder',
      isActive: true,
      isBanned: false
    }).select('name avatar startup bio skills mindset');

    const newMatches = [];

    for (const potentialMatch of potentialMatches) {
      // Calculate compatibility score
      const compatibility = calculateCompatibility(currentUser, potentialMatch);

      if (compatibility.overall >= 50) { // Only create matches with 50%+ compatibility
        // Check if match already exists
        const existingMatch = await Match.findOne({
          $or: [
            { founder1: req.user.id, founder2: potentialMatch._id },
            { founder1: potentialMatch._id, founder2: req.user.id }
          ]
        });

        if (!existingMatch) {
          const match = new Match({
            founder1: req.user.id,
            founder2: potentialMatch._id,
            compatibility
          });

          await match.calculateCompatibility();
          await match.save();

          newMatches.push(match);
        }
      }
    }

    res.json({ 
      message: `Generated ${newMatches.length} new matches`,
      matches: newMatches
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/matches/:id/accept
// @desc    Accept a match
// @access  Private
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is part of this match
    if (match.founder1.toString() !== req.user.id && match.founder2.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await match.acceptMatch(req.user.id);

    res.json({ message: 'Match accepted', match });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/matches/:id/reject
// @desc    Reject a match
// @access  Private
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is part of this match
    if (match.founder1.toString() !== req.user.id && match.founder2.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await match.rejectMatch(req.user.id);

    res.json({ message: 'Match rejected', match });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/matches/:id/message
// @desc    Send message in a match
// @access  Private
router.post('/:id/message', [
  auth,
  body('content', 'Message content is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is part of this match
    if (match.founder1.toString() !== req.user.id && match.founder2.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await match.addMessage(req.user.id, content);

    const updatedMatch = await Match.findById(match._id)
      .populate('founder1', 'name avatar')
      .populate('founder2', 'name avatar')
      .populate('messages.sender', 'name avatar');

    res.json(updatedMatch);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/matches/:id/read
// @desc    Mark messages as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is part of this match
    if (match.founder1.toString() !== req.user.id && match.founder2.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await match.markAsRead(req.user.id);

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/matches/unread/count
// @desc    Get unread message count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [
        { founder1: req.user.id },
        { founder2: req.user.id }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    let totalUnread = 0;
    matches.forEach(match => {
      totalUnread += match.getUnreadCount(req.user.id);
    });

    res.json({ unreadCount: totalUnread });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to calculate compatibility
function calculateCompatibility(user1, user2) {
  const compatibility = {
    overall: 0,
    mindset: {
      riskTolerance: 0,
      workStyle: 0,
      communication: 0
    },
    skills: 0,
    experience: 0,
    goals: 0
  };

  // Calculate mindset compatibility
  if (user1.mindset && user2.mindset) {
    // Risk tolerance compatibility
    if (user1.mindset.riskTolerance === user2.mindset.riskTolerance) {
      compatibility.mindset.riskTolerance = 100;
    } else if (
      (user1.mindset.riskTolerance === 'moderate' && user2.mindset.riskTolerance !== 'moderate') ||
      (user2.mindset.riskTolerance === 'moderate' && user1.mindset.riskTolerance !== 'moderate')
    ) {
      compatibility.mindset.riskTolerance = 70;
    } else {
      compatibility.mindset.riskTolerance = 40;
    }

    // Work style compatibility
    if (user1.mindset.workStyle === user2.mindset.workStyle) {
      compatibility.mindset.workStyle = 100;
    } else if (user1.mindset.workStyle === 'hybrid' || user2.mindset.workStyle === 'hybrid') {
      compatibility.mindset.workStyle = 80;
    } else {
      compatibility.mindset.workStyle = 50;
    }

    // Communication compatibility
    if (user1.mindset.communication === user2.mindset.communication) {
      compatibility.mindset.communication = 100;
    } else if (user1.mindset.communication === 'collaborative' || user2.mindset.communication === 'collaborative') {
      compatibility.mindset.communication = 75;
    } else {
      compatibility.mindset.communication = 40;
    }
  }

  // Calculate skills compatibility
  if (user1.skills && user2.skills) {
    const commonSkills = user1.skills.filter(skill => user2.skills.includes(skill));
    const totalSkills = new Set([...user1.skills, ...user2.skills]).size;
    compatibility.skills = totalSkills > 0 ? (commonSkills.length / totalSkills) * 100 : 0;
  }

  // Calculate experience compatibility
  if (user1.experience && user2.experience) {
    const experienceLevels = { beginner: 1, intermediate: 2, expert: 3 };
    const diff = Math.abs(experienceLevels[user1.experience] - experienceLevels[user2.experience]);
    compatibility.experience = diff === 0 ? 100 : diff === 1 ? 70 : 40;
  }

  // Calculate goals compatibility (based on startup stage)
  if (user1.startup && user2.startup) {
    const stageLevels = { idea: 1, mvp: 2, users: 3, revenue: 4, scaling: 5 };
    const diff = Math.abs(stageLevels[user1.startup.stage] - stageLevels[user2.startup.stage]);
    compatibility.goals = diff === 0 ? 100 : diff === 1 ? 80 : diff === 2 ? 60 : 30;
  }

  // Calculate overall compatibility
  const scores = [
    compatibility.mindset.riskTolerance,
    compatibility.mindset.workStyle,
    compatibility.mindset.communication,
    compatibility.skills,
    compatibility.experience,
    compatibility.goals
  ].filter(score => score > 0);

  compatibility.overall = scores.length > 0 ? 
    Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

  return compatibility;
}

module.exports = router; 