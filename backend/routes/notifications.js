const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();

/**
 * @route   GET /api/notifications/:userId
 * @desc    Get notifications for a specific user
 * @access  Public (for POC)
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      status,
      limit = 50, 
      skip = 0,
      types,
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip),
    };

    if (status) {
      options.status = status;
    }

    if (types) {
      options.types = types.split(',');
    }

    const notifications = await Notification.getUserNotifications(userId, options);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      notifications,
      unreadCount,
      count: notifications.length,
      userId,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Public (for POC)
 */
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({ notificationId });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
      });
    }

    await notification.markAsRead();

    res.json({
      message: 'Notification marked as read',
      notification: {
        notificationId: notification.notificationId,
        status: notification.status,
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/:userId/read-all
 * @desc    Mark all notifications as read for a user
 * @access  Public (for POC)
 */
router.put('/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.markAllAsRead(userId);

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
      userId,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete/dismiss a notification
 * @access  Public (for POC)
 */
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({ notificationId });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
      });
    }

    await notification.dismiss();

    res.json({
      message: 'Notification dismissed',
      notificationId,
    });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      error: 'Failed to dismiss notification',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications (admin/debug endpoint)
 * @access  Public (for POC)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, status, type } = req.query;

    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('sourceUserId', 'username')
      .lean();

    // Get summary statistics
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: {
            status: '$status',
            type: '$type',
          },
          count: { $sum: 1 },
        }
      },
      {
        $group: {
          _id: '$_id.status',
          types: {
            $push: {
              type: '$_id.type',
              count: '$count',
            }
          },
          total: { $sum: '$count' },
        }
      }
    ]);

    res.json({
      notifications,
      count: notifications.length,
      stats,
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/cleanup
 * @desc    Clean up expired notifications
 * @access  Public (for POC)
 */
router.post('/cleanup', async (req, res) => {
  try {
    const result = await Notification.cleanupExpired();

    res.json({
      message: 'Cleanup completed',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({
      error: 'Failed to cleanup notifications',
      message: error.message,
    });
  }
});

module.exports = router;