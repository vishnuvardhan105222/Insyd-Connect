const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Event = require('../models/Event');

/**
 * In-memory event queue for processing notifications
 * In production, this would be replaced with Redis, RabbitMQ, or similar
 */
class EventQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(event) {
    this.queue.push(event);
    this.processQueue();
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      try {
        await this.processEvent(event);
      } catch (error) {
        console.error('Error processing event from queue:', error);
      }
    }

    this.processing = false;
  }

  async processEvent(event) {
    await processEvent(event);
  }
}

// Global event queue instance
const eventQueue = new EventQueue();

/**
 * Main function to process an event and generate notifications
 */
async function processEvent(event) {
  try {
    console.log(`🔄 Processing event: ${event.type} from ${event.sourceUserId}`);

    // Get the source user
    const sourceUser = await User.findByUserId(event.sourceUserId);
    if (!sourceUser) {
      console.error(`Source user not found: ${event.sourceUserId}`);
      return;
    }

    // Determine notification recipients based on event type
    const recipients = await getNotificationRecipients(event, sourceUser);

    // Generate notifications for each recipient
    const notifications = [];
    for (const recipient of recipients) {
      try {
        const notification = await createNotification(event, sourceUser, recipient);
        if (notification) {
          notifications.push(notification);
        }
      } catch (error) {
        console.error(`Error creating notification for user ${recipient.userId}:`, error);
      }
    }

    // Mark event as processed
    await Event.findOneAndUpdate(
      { eventId: event.eventId },
      { 
        processed: true,
        notificationsGenerated: notifications.map(n => ({
          notificationId: n.notificationId,
          userId: n.userId,
        }))
      }
    );

    console.log(`✅ Generated ${notifications.length} notifications for event ${event.eventId}`);
    return notifications;

  } catch (error) {
    console.error('Error in processEvent:', error);
    throw error;
  }
}

/**
 * Determine who should receive notifications for this event
 */
async function getNotificationRecipients(event, sourceUser) {
  const recipients = [];

  switch (event.type) {
    case 'LIKE':
    case 'COMMENT':
      // Notify the post owner (if different from source user)
      if (event.targetUserId && event.targetUserId !== event.sourceUserId) {
        const targetUser = await User.findByUserId(event.targetUserId);
        if (targetUser && shouldReceiveNotification(targetUser, event.type)) {
          recipients.push(targetUser);
        }
      }
      break;

    case 'FOLLOW':
      // Notify the user being followed
      if (event.targetUserId && event.targetUserId !== event.sourceUserId) {
        const targetUser = await User.findByUserId(event.targetUserId);
        if (targetUser && shouldReceiveNotification(targetUser, event.type)) {
          recipients.push(targetUser);
        }
      }
      break;

    case 'POST_CREATE':
      // Notify all followers
      const followers = await User.find({
        following: event.sourceUserId
      });
      
      for (const follower of followers) {
        if (shouldReceiveNotification(follower, event.type)) {
          recipients.push(follower);
        }
      }
      break;

    case 'MENTION':
      // Notify mentioned users (extracted from event data)
      if (event.data.mentionedUsers) {
        for (const mentionedUserId of event.data.mentionedUsers) {
          if (mentionedUserId !== event.sourceUserId) {
            const mentionedUser = await User.findByUserId(mentionedUserId);
            if (mentionedUser && shouldReceiveNotification(mentionedUser, event.type)) {
              recipients.push(mentionedUser);
            }
          }
        }
      }
      break;

    case 'SHARE':
      // Notify the original post owner
      if (event.targetUserId && event.targetUserId !== event.sourceUserId) {
        const targetUser = await User.findByUserId(event.targetUserId);
        if (targetUser && shouldReceiveNotification(targetUser, event.type)) {
          recipients.push(targetUser);
        }
      }
      break;

    default:
      console.warn(`Unknown event type: ${event.type}`);
  }

  return recipients;
}

/**
 * Check if a user should receive a notification of this type
 */
function shouldReceiveNotification(user, eventType) {
  return user.preferences.notificationTypes.includes(eventType);
}

/**
 * Create a notification for a specific user
 */
async function createNotification(event, sourceUser, targetUser) {
  try {
    // Check for duplicate notifications (debouncing)
    const recentDuplicate = await Notification.findOne({
      userId: targetUser.userId,
      sourceUserId: sourceUser.userId,
      type: event.type,
      'data.postId': event.data.postId,
      timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes
    });

    if (recentDuplicate) {
      console.log(`Skipping duplicate notification for ${targetUser.userId}`);
      return null;
    }

    // Generate notification content
    const content = generateNotificationContent(event, sourceUser);
    
    const notification = new Notification({
      notificationId: uuidv4(),
      userId: targetUser.userId,
      type: event.type,
      content,
      sourceUserId: sourceUser.userId,
      relatedEventId: event.eventId,
      data: {
        postId: event.data.postId,
        commentId: event.data.commentId,
        url: generateNotificationUrl(event),
        metadata: event.data.metadata || {},
      },
      status: 'unread',
      timestamp: new Date(),
    });

    await notification.save();
    console.log(`📧 Created notification for ${targetUser.userId}: ${content}`);
    
    return notification;

  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Generate human-readable notification content
 */
function generateNotificationContent(event, sourceUser) {
  const username = sourceUser.username;
  
  switch (event.type) {
    case 'LIKE':
      return `${username} liked your post`;
    
    case 'COMMENT':
      return event.data.content 
        ? `${username} commented: "${event.data.content.substring(0, 50)}${event.data.content.length > 50 ? '...' : ''}"`
        : `${username} commented on your post`;
    
    case 'FOLLOW':
      return `${username} started following you`;
    
    case 'POST_CREATE':
      return `${username} shared a new post`;
    
    case 'MENTION':
      return `${username} mentioned you in a post`;
    
    case 'SHARE':
      return `${username} shared your post`;
    
    default:
      return `${username} performed an action`;
  }
}

/**
 * Generate URL for notification (for deep linking)
 */
function generateNotificationUrl(event) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  switch (event.type) {
    case 'LIKE':
    case 'COMMENT':
    case 'SHARE':
      return event.data.postId ? `${baseUrl}/posts/${event.data.postId}` : baseUrl;
    
    case 'FOLLOW':
      return `${baseUrl}/profile/${event.sourceUserId}`;
    
    case 'POST_CREATE':
      return event.data.postId ? `${baseUrl}/posts/${event.data.postId}` : baseUrl;
    
    case 'MENTION':
      return event.data.postId ? `${baseUrl}/posts/${event.data.postId}` : baseUrl;
    
    default:
      return baseUrl;
  }
}

/**
 * Add event to processing queue
 */
function queueEvent(event) {
  eventQueue.enqueue(event);
}

/**
 * Process unprocessed events (for cleanup/recovery)
 */
async function processUnprocessedEvents() {
  try {
    const unprocessedEvents = await Event.getUnprocessedEvents();
    console.log(`📊 Found ${unprocessedEvents.length} unprocessed events`);
    
    for (const event of unprocessedEvents) {
      await processEvent(event);
    }
    
    console.log('✅ All unprocessed events have been processed');
  } catch (error) {
    console.error('Error processing unprocessed events:', error);
  }
}

/**
 * Cleanup old notifications (maintenance task)
 */
async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await Notification.deleteMany({
      timestamp: { $lt: thirtyDaysAgo },
      status: { $in: ['read', 'dismissed'] }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
}

module.exports = {
  processEvent,
  queueEvent,
  processUnprocessedEvents,
  cleanupOldNotifications,
  eventQueue,
};