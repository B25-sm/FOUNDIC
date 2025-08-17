const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['founder', 'investor', 'admin'],
    default: 'founder'
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500
  },
  location: {
    type: String
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: 'beginner'
  },
  
  // Founder-specific fields
  startup: {
    name: String,
    description: String,
    stage: {
      type: String,
      enum: ['idea', 'mvp', 'users', 'revenue', 'scaling'],
      default: 'idea'
    },
    industry: String,
    website: String,
    linkedin: String,
    twitter: String
  },
  
  // Investor-specific fields
  investor: {
    type: {
      type: String,
      enum: ['angel', 'vc', 'corporate', 'family_office'],
      default: 'angel'
    },
    investmentRange: {
      min: Number,
      max: Number
    },
    focusAreas: [String],
    portfolio: [String]
  },
  
  // DNA Match fields
  mindset: {
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    workStyle: {
      type: String,
      enum: ['structured', 'flexible', 'hybrid'],
      default: 'hybrid'
    },
    communication: {
      type: String,
      enum: ['direct', 'diplomatic', 'collaborative'],
      default: 'collaborative'
    }
  },
  
  // F-Coin system
  fCoins: {
    type: Number,
    default: 0
  },
  coinHistory: [{
    amount: Number,
    action: String,
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Pod participation
  podsJoined: [{
    podId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pod'
    },
    role: {
      type: String,
      enum: ['founder', 'contributor', 'mentor'],
      default: 'contributor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  
  // Preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    matches: {
      type: Boolean,
      default: true
    },
    pods: {
      type: Boolean,
      default: true
    }
  },
  
  // Social connections
  connections: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Activity tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'startup.stage': 1 });
userSchema.index({ fCoins: -1 });
userSchema.index({ isVerified: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add F-Coins method
userSchema.methods.addFCoins = function(amount, action, description) {
  this.fCoins += amount;
  this.coinHistory.push({
    amount,
    action,
    description,
    date: new Date()
  });
  return this.save();
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.notifications;
  delete userObject.connections;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 