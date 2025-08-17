const mongoose = require('mongoose');

const podSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  founder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['tech', 'health', 'finance', 'education', 'ecommerce', 'ai', 'sustainability', 'other'],
    required: true
  },
  stage: {
    type: String,
    enum: ['planning', 'active', 'completed', 'paused'],
    default: 'planning'
  },
  
  // Sprint details
  sprintDays: {
    type: Number,
    default: 60,
    min: 30,
    max: 90
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Goals and milestones
  goals: [{
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    description: String,
    deadline: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    },
    completedAt: Date
  }],
  
  // Team and roles
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['founder', 'co-founder', 'developer', 'designer', 'marketer', 'mentor', 'investor'],
      required: true
    },
    contribution: {
      type: String,
      enum: ['equity', 'barter', 'rev_share', 'volunteer'],
      required: true
    },
    equityPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'left'],
      default: 'active'
    }
  }],
  
  // Compensation model
  compensationModel: {
    type: String,
    enum: ['equity', 'barter', 'rev_share', 'hybrid'],
    required: true
  },
  
  // Equity distribution
  equityDistribution: {
    founder: {
      type: Number,
      default: 60,
      min: 0,
      max: 100
    },
    team: {
      type: Number,
      default: 30,
      min: 0,
      max: 100
    },
    reserved: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    }
  },
  
  // Resources and tools
  resources: [{
    name: String,
    type: {
      type: String,
      enum: ['tool', 'service', 'platform', 'other']
    },
    url: String,
    description: String
  }],
  
  // Progress tracking
  progress: {
    currentMilestone: {
      type: Number,
      default: 0
    },
    totalMilestones: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastUpdate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Communication
  communication: {
    platform: {
      type: String,
      enum: ['slack', 'discord', 'telegram', 'whatsapp', 'other'],
      default: 'slack'
    },
    channelUrl: String,
    meetingSchedule: String
  },
  
  // Pod visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
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
    activeMembers: {
      type: Number,
      default: 1
    }
  },
  
  // Tags for discovery
  tags: [{
    type: String,
    trim: true
  }],
  
  // Pod status
  status: {
    type: String,
    enum: ['draft', 'open', 'full', 'closed', 'completed'],
    default: 'draft'
  },
  
  // Application process
  applicationProcess: {
    isOpen: {
      type: Boolean,
      default: true
    },
    requirements: [String],
    maxMembers: {
      type: Number,
      default: 10
    },
    applicationDeadline: Date
  },
  
  // Reviews and feedback
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Pod outcomes
  outcomes: {
    mvpLaunched: {
      type: Boolean,
      default: false
    },
    firstUsers: {
      type: Number,
      default: 0
    },
    firstRevenue: {
      type: Number,
      default: 0
    },
    fundingRaised: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
podSchema.index({ founder: 1 });
podSchema.index({ category: 1 });
podSchema.index({ stage: 1 });
podSchema.index({ status: 1 });
podSchema.index({ 'members.userId': 1 });
podSchema.index({ isFeatured: 1 });
podSchema.index({ createdAt: -1 });

// Virtual for member count
podSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Virtual for days remaining
podSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Update progress percentage
podSchema.methods.updateProgress = function() {
  if (this.goals.length === 0) {
    this.progress.completionPercentage = 0;
    return this.save();
  }
  
  const completedGoals = this.goals.filter(goal => goal.status === 'completed').length;
  this.progress.completionPercentage = Math.round((completedGoals / this.goals.length) * 100);
  this.progress.totalMilestones = this.goals.length;
  this.progress.lastUpdate = new Date();
  
  return this.save();
};

// Add member to pod
podSchema.methods.addMember = function(userId, role, contribution, equityPercentage = 0) {
  const existingMember = this.members.find(member => member.userId.toString() === userId.toString());
  
  if (existingMember) {
    throw new Error('User is already a member of this pod');
  }
  
  this.members.push({
    userId,
    role,
    contribution,
    equityPercentage
  });
  
  this.metrics.activeMembers = this.members.filter(m => m.status === 'active').length;
  
  return this.save();
};

// Remove member from pod
podSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.userId.toString() !== userId.toString());
  this.metrics.activeMembers = this.members.filter(m => m.status === 'active').length;
  
  return this.save();
};

module.exports = mongoose.model('Pod', podSchema); 