const User = require('../models/User');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

/**
 * Seed the database with sample data for testing
 */
async function seedDatabase() {
  try {
    // Check if data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('📊 Database already contains data, skipping seed');
      return;
    }

    console.log('🌱 Seeding database with sample data...');

    // Create sample users
    const sampleUsers = [
      {
        userId: 'user1',
        username: 'alex_architect',
        email: 'alex@example.com',
        profile: {
          bio: 'Senior Architect at DesignCorp',
          location: 'Mumbai, India',
          company: 'DesignCorp',
          website: 'https://alexarchitect.com'
        },
        followers: ['user2', 'user3'],
        following: ['user2', 'user4'],
      },
      {
        userId: 'user2',
        username: 'priya_designer',
        email: 'priya@example.com',
        profile: {
          bio: 'Interior Designer & Space Planner',
          location: 'Delhi, India',
          company: 'SpaceWorks',
        },
        followers: ['user1', 'user3', 'user4'],
        following: ['user1'],
      },
      {
        userId: 'user3',
        username: 'rohit_urban',
        email: 'rohit@example.com',
        profile: {
          bio: 'Urban Planner & Smart City Consultant',
          location: 'Bangalore, India',
          company: 'UrbanTech Solutions',
        },
        followers: ['user4'],
        following: ['user1', 'user2'],
      },
      {
        userId: 'user4',
        username: 'maya_sustainable',
        email: 'maya@example.com',
        profile: {
          bio: 'Sustainable Architecture Specialist',
          location: 'Pune, India',
          company: 'GreenBuild Studio',
        },
        followers: ['user1'],
        following: ['user2', 'user3'],
      },
      {
        userId: 'user5',
        username: 'demo_user',
        email: 'demo@example.com',
        profile: {
          bio: 'Demo user for testing notifications',
          location: 'Chennai, India',
          company: 'Test Company',
        },
        followers: [],
        following: ['user1', 'user2'],
      }
    ];

    // Insert users
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`👥 Created ${createdUsers.length} sample users`);

    // Create sample events
    const sampleEvents = [
      {
        eventId: uuidv4(),
        type: 'FOLLOW',
        sourceUserId: 'user2',
        targetUserId: 'user1',
        data: {},
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        processed: true,
      },
      {
        eventId: uuidv4(),
        type: 'LIKE',
        sourceUserId: 'user3',
        targetUserId: 'user1',
        data: {
          postId: 'post123',
          content: 'Great sustainable design project!'
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        processed: true,
      },
      {
        eventId: uuidv4(),
        type: 'COMMENT',
        sourceUserId: 'user4',
        targetUserId: 'user2',
        data: {
          postId: 'post456',
          commentId: 'comment789',
          content: 'Love the use of natural lighting in this design!'
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
        processed: true,
      },
      {
        eventId: uuidv4(),
        type: 'POST_CREATE',
        sourceUserId: 'user1',
        targetUserId: null,
        data: {
          postId: 'post789',
          content: 'Just completed a sustainable office complex in Mumbai'
        },
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
        processed: true,
      },
      {
        eventId: uuidv4(),
        type: 'MENTION',
        sourceUserId: 'user2',
        targetUserId: 'user1',
        data: {
          postId: 'post999',
          content: 'Thanks to @alex_architect for the inspiration!',
          mentionedUsers: ['user1']
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        processed: true,
      }
    ];

    // Insert events
    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`📅 Created ${createdEvents.length} sample events`);

    // Create sample notifications
    const sampleNotifications = [
      {
        notificationId: uuidv4(),
        userId: 'user1',
        type: 'FOLLOW',
        content: 'priya_designer started following you',
        status: 'unread',
        sourceUserId: 'user2',
        relatedEventId: sampleEvents[0].eventId,
        data: {
          url: 'http://localhost:3000/profile/user2'
        },
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        notificationId: uuidv4(),
        userId: 'user1',
        type: 'LIKE',
        content: 'rohit_urban liked your post',
        status: 'unread',
        sourceUserId: 'user3',
        relatedEventId: sampleEvents[1].eventId,
        data: {
          postId: 'post123',
          url: 'http://localhost:3000/posts/post123'
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        notificationId: uuidv4(),
        userId: 'user2',
        type: 'COMMENT',
        content: 'maya_sustainable commented: "Love the use of natural lighting in this design!"',
        status: 'read',
        readAt: new Date(Date.now() - 20 * 60 * 1000),
        sourceUserId: 'user4',
        relatedEventId: sampleEvents[2].eventId,
        data: {
          postId: 'post456',
          commentId: 'comment789',
          url: 'http://localhost:3000/posts/post456'
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        notificationId: uuidv4(),
        userId: 'user2',
        type: 'POST_CREATE',
        content: 'alex_architect shared a new post',
        status: 'unread',
        sourceUserId: 'user1',
        relatedEventId: sampleEvents[3].eventId,
        data: {
          postId: 'post789',
          url: 'http://localhost:3000/posts/post789'
        },
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        notificationId: uuidv4(),
        userId: 'user1',
        type: 'MENTION',
        content: 'priya_designer mentioned you in a post',
        status: 'unread',
        sourceUserId: 'user2',
        relatedEventId: sampleEvents[4].eventId,
        data: {
          postId: 'post999',
          url: 'http://localhost:3000/posts/post999'
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      }
    ];

    // Insert notifications
    const createdNotifications = await Notification.insertMany(sampleNotifications);
    console.log(`🔔 Created ${createdNotifications.length} sample notifications`);

    console.log('✅ Database seeding completed successfully!');
    
    // Log summary
    console.log('\n📊 Sample Data Summary:');
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Events: ${createdEvents.length}`);
    console.log(`- Notifications: ${createdNotifications.length}`);
    console.log('\n🧪 Test with these users:');
    console.log('- user1 (alex_architect) - has 3 unread notifications');
    console.log('- user2 (priya_designer) - has 1 unread, 1 read notification');
    console.log('- user3 (rohit_urban) - no notifications');
    console.log('- user4 (maya_sustainable) - no notifications');
    console.log('- user5 (demo_user) - no notifications\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

/**
 * Clear all data from the database (for testing)
 */
async function clearDatabase() {
  try {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Notification.deleteMany({});
    console.log('🧹 Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

module.exports = {
  seedDatabase,
  clearDatabase,
};