const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Event = require('../models/Event');
const { processEvent } = require('../services/notificationProcessor');
const router = express.Router();

/**
 * @route   POST /api/events
 * @desc    Create a new event and trigger notification processing
 * @access  Public (for POC - would be protected in production)
 */
router.post('/', async (req, res) => {
  try {
    const { type, sourceUserId, targetUserId, data = {} } = req.body;

    // Validation
    if (!type || !sourceUserId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'sourceUserId'],
      });
    }

    const validTypes = ['LIKE', 'FOLLOW', 'COMMENT', 'POST_CREATE', 'MENTION', 'SHARE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid event type',
        validTypes,
      });
    }

    // Create event
    const event = new Event({
      eventId: uuidv4(),
      type,
      sourceUserId,
      targetUserId,
      data,
      timestamp: new Date(),
    });

    await event.save();

    // Process event asynchronously to generate notifications
    setImmediate(async () => {
      try {
        await processEvent(event);
        console.log(`✅ Event processed: ${event.eventId}`);
      } catch (error) {
        console.error(`❌ Error processing event ${event.eventId}:`, error);
      }
    });

    res.status(201).json({
      message: 'Event created successfully',
      event: {
        eventId: event.eventId,
        type: event.type,
        timestamp: event.timestamp,
      },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      error: 'Failed to create event',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/events/:userId
 * @desc    Get events for a specific user
 * @access  Public (for POC)
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, type } = req.query;

    let query = {
      $or: [
        { sourceUserId: userId },
        { targetUserId: userId },
      ]
    };

    if (type) {
      query.type = type;
    }

    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      events,
      count: events.length,
      userId,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/events
 * @desc    Get all events (admin/debug endpoint)
 * @access  Public (for POC)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, type, processed } = req.query;

    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (processed !== undefined) {
      query.processed = processed === 'true';
    }

    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    const stats = await Event.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          processed: { $sum: { $cond: ['$processed', 1, 0] } },
        }
      }
    ]);

    res.json({
      events,
      count: events.length,
      stats,
    });
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/events/:eventId
 * @desc    Delete an event (admin/cleanup endpoint)
 * @access  Public (for POC)
 */
router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const deletedEvent = await Event.findOneAndDelete({ eventId });

    if (!deletedEvent) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    res.json({
      message: 'Event deleted successfully',
      eventId,
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      error: 'Failed to delete event',
      message: error.message,
    });
  }
});

module.exports = router;