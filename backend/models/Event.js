const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['LIKE', 'FOLLOW', 'COMMENT', 'POST_CREATE', 'MENTION', 'SHARE'],
    index: true,
  },
  sourceUserId: {
    type: String,
    required: true,
    ref: 'User',
    index: true,
  },
  targetUserId: {
    type: String,
    ref: 'User',
    index: true,
  },
  data: {
    postId: String,
    commentId: String,
    content: String,
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
  processed: {
    type: Boolean,
    default: false,
    index: true,
  },
  notificationsGenerated: [{
    notificationId: String,
    userId: String,
  }],
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
eventSchema.index({ sourceUserId: 1, timestamp: -1 });
eventSchema.index({ targetUserId: 1, timestamp: -1 });
eventSchema.index({ type: 1, timestamp: -1 });
eventSchema.index({ processed: 1, timestamp: 1 });

// Static methods
eventSchema.statics.getRecentEvents = function(userId, limit = 50) {
  return this.find({
    $or: [
      { sourceUserId: userId },
      { targetUserId: userId },
    ]
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('sourceUserId', 'username')
  .populate('targetUserId', 'username');
};

eventSchema.statics.getEventsByType = function(type, limit = 100) {
  return this.find({ type })
    .sort({ timestamp: -1 })
    .limit(limit);
};

eventSchema.statics.getUnprocessedEvents = function() {
  return this.find({ processed: false })
    .sort({ timestamp: 1 }); // Process oldest first
};

// Instance methods
eventSchema.methods.markAsProcessed = function() {
  this.processed = true;
  return this.save();
};

eventSchema.methods.addNotification = function(notificationId, userId) {
  this.notificationsGenerated.push({ notificationId, userId });
  return this.save();
};

// Virtual for event description
eventSchema.virtual('description').get(function() {
  const descriptions = {
    LIKE: 'liked your post',
    FOLLOW: 'started following you',
    COMMENT: 'commented on your post',
    POST_CREATE: 'created a new post',
    MENTION: 'mentioned you in a post',
    SHARE: 'shared your post',
  };
  return descriptions[this.type] || 'performed an action';
});

// Pre-save middleware
eventSchema.pre('save', function(next) {
  if (this.isNew && !this.eventId) {
    this.eventId = new mongoose.Types.ObjectId().toString();
  }
  next();
});

// Transform output
eventSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Event', eventSchema);