const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['LIKE', 'FOLLOW', 'COMMENT', 'POST_CREATE', 'MENTION', 'SHARE'],
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'dismissed'],
    default: 'unread',
    index: true,
  },
  relatedEventId: {
    type: String,
    ref: 'Event',
    index: true,
  },
  sourceUserId: {
    type: String,
    ref: 'User',
    index: true,
  },
  data: {
    postId: String,
    commentId: String,
    url: String,
    imageUrl: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  readAt: {
    type: Date,
  },
  dismissedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Notifications expire after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    },
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, timestamp: -1 });
notificationSchema.index({ userId: 1, status: 1, timestamp: -1 });
notificationSchema.index({ type: 1, timestamp: -1 });
notificationSchema.index({ sourceUserId: 1, timestamp: -1 });

// Static methods
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    status = null,
    limit = 50,
    skip = 0,
    types = null,
  } = options;

  let query = { userId };
  
  if (status) {
    query.status = status;
  }
  
  if (types && types.length > 0) {
    query.type = { $in: types };
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('sourceUserId', 'username profile.company');
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, status: 'unread' });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, status: 'unread' },
    { 
      status: 'read',
      readAt: new Date(),
    }
  );
};

notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  if (this.status === 'unread') {
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  this.dismissedAt = new Date();
  return this.save();
};

notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Virtual for age in minutes
notificationSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((new Date() - this.timestamp) / (1000 * 60));
});

// Virtual for formatted timestamp
notificationSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((new Date() - this.timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  
  return this.timestamp.toLocaleDateString();
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.notificationId) {
    this.notificationId = new mongoose.Types.ObjectId().toString();
  }
  next();
});

// Transform output
notificationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.expiresAt; // Don't expose expiration in API
    return ret;
  }
});

module.exports = mongoose.model('Notification', notificationSchema);