const express = require('express');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all jobs with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      type, 
      location, 
      remote, 
      limit = 20, 
      page = 1 
    } = req.query;

    let query = { status: 'active' };

    if (category) query.category = category;
    if (type) query.type = type;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (remote === 'true') query.remote = true;

    const jobs = await Job.find(query)
      .populate('employer', 'name avatar startup')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
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

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name avatar startup bio')
      .populate('applications.userId', 'name avatar bio skills');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private
router.post('/', [
  auth,
  body('title', 'Job title is required').not().isEmpty(),
  body('description', 'Job description is required').not().isEmpty(),
  body('category', 'Category is required').isIn(['tech', 'health', 'finance', 'education', 'ecommerce', 'ai', 'sustainability', 'other']),
  body('type', 'Job type is required').isIn(['full-time', 'part-time', 'contract', 'internship', 'volunteer']),
  body('location', 'Location is required').not().isEmpty()
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
      type,
      location,
      remote,
      salary,
      requirements,
      benefits,
      podId
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'founder' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Only founders can post jobs' });
    }

    const job = new Job({
      title,
      description,
      employer: req.user.id,
      category,
      type,
      location,
      remote: remote || false,
      salary,
      requirements: requirements || [],
      benefits: benefits || [],
      podId
    });

    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('employer', 'name avatar startup');

    res.json(populatedJob);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is the employer
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allowedUpdates = [
      'title', 'description', 'category', 'type', 'location', 'remote',
      'salary', 'requirements', 'benefits', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();

    const updatedJob = await Job.findById(job._id)
      .populate('employer', 'name avatar startup');

    res.json(updatedJob);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is the employer or admin
    const user = await User.findById(req.user.id);
    if (job.employer.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    job.status = 'deleted';
    await job.save();

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/jobs/:id/apply
// @desc    Apply for a job
// @access  Private
router.post('/:id/apply', [
  auth,
  body('coverLetter', 'Cover letter is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { coverLetter, resume } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ error: 'Job is not accepting applications' });
    }

    // Check if user already applied
    const existingApplication = job.applications.find(
      app => app.userId.toString() === req.user.id
    );

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied for this job' });
    }

    // Add application
    job.applications.push({
      userId: req.user.id,
      coverLetter,
      resume: resume || '',
      status: 'pending'
    });

    await job.save();

    res.json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id/applications/:applicationId
// @desc    Update application status
// @access  Private
router.put('/:id/applications/:applicationId', [
  auth,
  body('status', 'Status must be valid').isIn(['accepted', 'rejected', 'pending'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, feedback } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is the employer
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const application = job.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.status = status;
    if (feedback) {
      application.feedback = feedback;
    }

    await job.save();

    res.json({ message: 'Application status updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/user/posted
// @desc    Get jobs posted by current user
// @access  Private
router.get('/user/posted', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user.id })
      .populate('employer', 'name avatar startup')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/user/applied
// @desc    Get jobs applied by current user
// @access  Private
router.get('/user/applied', auth, async (req, res) => {
  try {
    const jobs = await Job.find({
      'applications.userId': req.user.id
    })
    .populate('employer', 'name avatar startup')
    .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 