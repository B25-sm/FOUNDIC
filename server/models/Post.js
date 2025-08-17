const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['fail_forward', 'signal_boost', 'investor_connect', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  // Media attachments
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number
  }],
  
  // Fail Forward specific fields
  failure: {
    category: {
      type: String,
      enum: ['product', 'market', 'team', 'funding', 'execution', 'other'],
      default: 'other'
    },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    lessons: [String],
    recoverySteps: [String]
  },
  
  // Signal Boost specific fields
  signal: {
    type: {
      type: String,
      enum: ['first_users', 'mvp_launch', 'first_revenue', 'funding', 'partnership', 'milestone', 'other'],
      required: function() { return this.type === 'signal_boost'; }
    },
    metrics: {
      users: Number,
      revenue: Number,
      growth: Number,
      other: String
    },
    impact: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    }
  },
  
  // Investor Connect specific fields
  investor: {
    stage: {
      type: String,
      enum: ['idea', 'mvp', 'users', 'revenue', 'scaling'],
      required: function() { return this.type === 'investor_connect'; }
    },
    traction: {
      users: Number,
      revenue: Number,
      growth: Number,
      teamSize: Number
    },
    funding: {
      amount: Number,
      type: {
        type: String,
        enum: ['seed', 'series_a', 'series_b', 'other']
      },
      use: String
    },
    pitchDeck: String,
    demoUrl: String
  },
  
  // Engagement metrics
  engagement: {
    likes: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      date: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      userId: {
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
      likes: [{
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        date: {
          type: Date,
          default: Date.now
        }
      }]
    }],
    shares: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      platform: String,
      date: {
        type: Date,
        default: Date.now
      }
    }],
    views: {
      type: Number,
      default: 0
    }
  },
  
  // Visibility and moderation
  visibility: {
    type: String,
    enum: ['public', 'community', 'private'],
    default: 'public'
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // Tags and categories
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['tech', 'health', 'finance', 'education', 'ecommerce', 'ai', 'sustainability', 'other'],
    default: 'other'
  },
  
  // Post status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'deleted'],
    default: 'published'
  },
  
  // Related content
  relatedPosts: [{
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    relationship: {
      type: String,
      enum: ['follow_up', 'related', 'response']
    }
  }],
  
  // Analytics
  analytics: {
    reach: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    },
    conversion: {
      type: Number,
      default: 0
    }
  },
  
  // Moderation
  moderation: {
    flagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
postSchema.index({ author: 1 });
postSchema.index({ type: 1 });
postSchema.index({ status: 1 });
postSchema.index({ isFeatured: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'engagement.likes': 1 });
postSchema.index({ tags: 1 });
postSchema.index({ category: 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.engagement.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.engagement.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.engagement.shares.length;
});

// Virtual for engagement score
postSchema.virtual('engagementScore').get(function() {
  return this.likeCount + (this.commentCount * 2) + (this.shareCount * 3) + this.engagement.views;
});

// Add like to post
postSchema.methods.addLike = function(userId) {
  const existingLike = this.engagement.likes.find(like => 
    like.userId.toString() === userId.toString()
  );
  
  if (existingLike) {
    throw new Error('User has already liked this post');
  }
  
  this.engagement.likes.push({ userId });
  return this.save();
};

// Remove like from post
postSchema.methods.removeLike = function(userId) {
  this.engagement.likes = this.engagement.likes.filter(like => 
    like.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Add comment to post
postSchema.methods.addComment = function(userId, content) {
  this.engagement.comments.push({
    userId,
    content
  });
  return this.save();
};

// Add share to post
postSchema.methods.addShare = function(userId, platform) {
  this.engagement.shares.push({
    userId,
    platform
  });
  return this.save();
};

// Increment view count
postSchema.methods.incrementViews = function() {
  this.engagement.views += 1;
  return this.save();
};

// Get public post data (without sensitive information)
postSchema.methods.getPublicData = function() {
  const postObject = this.toObject();
  delete postObject.moderation;
  return postObject;
};

module.exports = mongoose.model('Post', postSchema); 