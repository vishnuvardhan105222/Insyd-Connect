const express = require('express');
const User = require('../models/User');
const router = express.Router();

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile
 * @access  Public (for POC)
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:userId/preferences
 * @desc    Update user notification preferences
 * @access  Public (for POC)
 */
router.put('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        error: 'Missing preferences in request body',
      });
    }

    const user = await User.findByUserId(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    await user.updatePreferences(preferences);

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/users/:userId/follow
 * @desc    Follow another user
 * @access  Public (for POC)
 */
router.post('/:userId/follow', async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        error: 'Missing targetUserId in request body',
      });
    }

    if (userId === targetUserId) {
      return res.status(400).json({
        error: 'Cannot follow yourself',
      });
    }

    const user = await User.findByUserId(userId);
    const targetUser = await User.findByUserId(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Add to following list
    await user.follow(targetUserId);
    
    // Add to followers list
    if (!targetUser.followers.includes(userId)) {
      targetUser.followers.push(userId);
      await targetUser.save();
    }

    res.json({
      message: 'Successfully followed user',
      isFollowing: true,
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      error: 'Failed to follow user',
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/users/:userId/follow
 * @desc    Unfollow another user
 * @access  Public (for POC)
 */
router.delete('/:userId/follow', async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        error: 'Missing targetUserId in request body',
      });
    }

    const user = await User.findByUserId(userId);
    const targetUser = await User.findByUserId(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Remove from following list
    await user.unfollow(targetUserId);
    
    // Remove from followers list
    targetUser.followers = targetUser.followers.filter(id => id !== userId);
    await targetUser.save();

    res.json({
      message: 'Successfully unfollowed user',
      isFollowing: false,
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      error: 'Failed to unfollow user',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users (for POC/testing)
 * @access  Public (for POC)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 20, search } = req.query;

    let users;
    if (search) {
      users = await User.searchUsers(search, parseInt(limit));
    } else {
      users = await User.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
    }

    res.json({
      users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user (for POC/testing)
 * @access  Public (for POC)
 */
router.post('/', async (req, res) => {
  try {
    const { userId, username, email, profile } = req.body;

    if (!userId || !username || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'username', 'email'],
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ userId }, { email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        field: existingUser.userId === userId ? 'userId' : 
               existingUser.email === email ? 'email' : 'username',
      });
    }

    const user = new User({
      userId,
      username,
      email,
      profile: profile || {},
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message,
    });
  }
});

module.exports = router;