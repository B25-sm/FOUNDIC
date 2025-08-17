const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  founder1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  founder2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Compatibility scores
  compatibility: {
    overall: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    mindset: {
      riskTolerance: {
        type: Number,
        min: 0,
        max: 100
      },
      workStyle: {
        type: Number,
        min: 0,
        max: 100
      },
      communication: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    skills: {
      type: Number,
      min: 0,
      max: 100
    },
    experience: {
      type: Number,
      min: 0,
      max: 100
    },
    goals: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Match status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'connected'],
    default: 'pending'
  },
  
  // Match details
  matchType: {
    type: String,
    enum: ['co-founder', 'mentor', 'advisor', 'investor'],
    default: 'co-founder'
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    date: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Match preferences
  preferences: {
    founder1: {
      interested: {
        type: Boolean,
        default: false
      },
      interestDate: Date,
      notes: String
    },
    founder2: {
      interested: {
        type: Boolean,
        default: false
      },
      interestDate: Date,
      notes: String
    }
  },
  
  // Match metadata
  metadata: {
    matchReason: [String],
    potentialSynergies: [String],
    redFlags: [String],
    recommendations: [String]
  },
  
  // Match timeline
  timeline: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    firstMessage: Date,
    lastMessage: Date,
    acceptedAt: Date,
    rejectedAt: Date,
    expiredAt: Date
  },
  
  // Match quality
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'fair'
  },
  
  // Match visibility
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Match feedback
  feedback: {
    founder1: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      date: Date
    },
    founder2: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      date: Date
    }
  },
  
  // Match outcomes
  outcomes: {
    meetingScheduled: {
      type: Boolean,
      default: false
    },
    meetingDate: Date,
    partnershipFormed: {
      type: Boolean,
      default: false
    },
    startupCreated: {
      type: Boolean,
      default: false
    },
    startupName: String
  },
  
  // Match analytics
  analytics: {
    messageCount: {
      type: Number,
      default: 0
    },
    responseTime: {
      founder1: Number, // in hours
      founder2: Number
    },
    engagementScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
matchSchema.index({ founder1: 1, founder2: 1 }, { unique: true });
matchSchema.index({ status: 1 });
matchSchema.index({ 'compatibility.overall': -1 });
matchSchema.index({ createdAt: -1 });
matchSchema.index({ 'timeline.lastMessage': -1 });

// Virtual for match duration
matchSchema.virtual('duration').get(function() {
  const now = new Date();
  const created = new Date(this.timeline.createdAt);
  const diffTime = now - created;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for message count
matchSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for unread messages for a user
matchSchema.methods.getUnreadCount = function(userId) {
  return this.messages.filter(msg => 
    msg.sender.toString() !== userId.toString() && !msg.isRead
  ).length;
};

// Add message to match
matchSchema.methods.addMessage = function(senderId, content) {
  this.messages.push({
    sender: senderId,
    content
  });
  
  this.timeline.lastMessage = new Date();
  this.analytics.messageCount = this.messages.length;
  
  return this.save();
};

// Mark messages as read for a user
matchSchema.methods.markAsRead = function(userId) {
  this.messages.forEach(msg => {
    if (msg.sender.toString() !== userId.toString() && !msg.isRead) {
      msg.isRead = true;
    }
  });
  
  return this.save();
};

// Accept match
matchSchema.methods.acceptMatch = function(founderId) {
  if (founderId.toString() === this.founder1.toString()) {
    this.preferences.founder1.interested = true;
    this.preferences.founder1.interestDate = new Date();
  } else if (founderId.toString() === this.founder2.toString()) {
    this.preferences.founder2.interested = true;
    this.preferences.founder2.interestDate = new Date();
  }
  
  // If both founders are interested, mark as accepted
  if (this.preferences.founder1.interested && this.preferences.founder2.interested) {
    this.status = 'accepted';
    this.timeline.acceptedAt = new Date();
  }
  
  return this.save();
};

// Reject match
matchSchema.methods.rejectMatch = function(founderId) {
  this.status = 'rejected';
  this.timeline.rejectedAt = new Date();
  
  if (founderId.toString() === this.founder1.toString()) {
    this.preferences.founder1.interested = false;
  } else if (founderId.toString() === this.founder2.toString()) {
    this.preferences.founder2.interested = false;
  }
  
  return this.save();
};

// Calculate compatibility score
matchSchema.methods.calculateCompatibility = function() {
  const scores = [
    this.compatibility.mindset.riskTolerance,
    this.compatibility.mindset.workStyle,
    this.compatibility.mindset.communication,
    this.compatibility.skills,
    this.compatibility.experience,
    this.compatibility.goals
  ].filter(score => score !== undefined);
  
  if (scores.length === 0) return 0;
  
  this.compatibility.overall = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );
  
  // Set quality based on overall score
  if (this.compatibility.overall >= 85) {
    this.quality = 'excellent';
  } else if (this.compatibility.overall >= 70) {
    this.quality = 'good';
  } else if (this.compatibility.overall >= 50) {
    this.quality = 'fair';
  } else {
    this.quality = 'poor';
  }
  
  return this.save();
};

// Get match summary
matchSchema.methods.getSummary = function() {
  return {
    id: this._id,
    founder1: this.founder1,
    founder2: this.founder2,
    compatibility: this.compatibility.overall,
    status: this.status,
    quality: this.quality,
    messageCount: this.messages.length,
    lastMessage: this.timeline.lastMessage,
    createdAt: this.timeline.createdAt
  };
};

module.exports = mongoose.model('Match', matchSchema); 