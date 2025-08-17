const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['tech', 'health', 'finance', 'education', 'ecommerce', 'ai', 'sustainability', 'other'],
    required: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'volunteer'],
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  
  // Compensation
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  
  // Requirements and benefits
  requirements: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  
  // Applications
  applications: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    coverLetter: {
      type: String,
      required: true,
      maxlength: 2000
    },
    resume: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending'
    },
    feedback: String,
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Job status
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'deleted'],
    default: 'active'
  },
  
  // Pod association (optional)
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod'
  },
  
  // Job metadata
  tags: [{
    type: String,
    trim: true
  }],
  
  // Metrics
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  
  // Application deadline
  deadline: Date,
  
  // Job visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ employer: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ isFeatured: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for application count
jobSchema.virtual('applicationCount').get(function() {
  return this.applications.length;
});

// Virtual for days until deadline
jobSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Add application to job
jobSchema.methods.addApplication = function(userId, coverLetter, resume = '') {
  const existingApplication = this.applications.find(
    app => app.userId.toString() === userId.toString()
  );
  
  if (existingApplication) {
    throw new Error('User has already applied for this job');
  }
  
  this.applications.push({
    userId,
    coverLetter,
    resume
  });
  
  this.metrics.applications = this.applications.length;
  
  return this.save();
};

// Update application status
jobSchema.methods.updateApplicationStatus = function(applicationId, status, feedback = '') {
  const application = this.applications.id(applicationId);
  
  if (!application) {
    throw new Error('Application not found');
  }
  
  application.status = status;
  if (feedback) {
    application.feedback = feedback;
  }
  
  return this.save();
};

// Increment view count
jobSchema.methods.incrementViews = function() {
  this.metrics.views += 1;
  return this.save();
};

// Get public job data
jobSchema.methods.getPublicData = function() {
  const jobObject = this.toObject();
  delete jobObject.applications;
  return jobObject;
};

module.exports = mongoose.model('Job', jobSchema); 