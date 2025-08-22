const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    notificationTypes: {
      type: [String],
      enum: ['LIKE', 'FOLLOW', 'COMMENT', 'POST_CREATE', 'MENTION'],
      default: ['LIKE', 'FOLLOW', 'COMMENT', 'POST_CREATE', 'MENTION'],
    },
  },
  profile: {
    bio: String,
    location: String,
    company: String,
    website: String,
  },
  followers: [{
    type: String,
    ref: 'User',
  }],
  following: [{
    type: String,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

// Methods
userSchema.methods.follow = function(targetUserId) {
  if (!this.following.includes(targetUserId)) {
    this.following.push(targetUserId);
  }
  return this.save();
};

userSchema.methods.unfollow = function(targetUserId) {
  this.following = this.following.filter(id => id !== targetUserId);
  return this.save();
};

userSchema.methods.isFollowing = function(targetUserId) {
  return this.following.includes(targetUserId);
};

userSchema.methods.updatePreferences = function(newPreferences) {
  this.preferences = { ...this.preferences, ...newPreferences };
  this.updatedAt = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

userSchema.statics.searchUsers = function(query, limit = 10) {
  return this.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ]
  }).limit(limit);
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Transform output
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.email; // Don't expose email in API responses
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);