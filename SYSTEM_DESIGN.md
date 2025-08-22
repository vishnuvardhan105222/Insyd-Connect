# Insyd Notification System - System Design Document

## Overview
This document outlines the design for a scalable notification system for Insyd, a social platform for the Architecture Industry, designed to handle 100 DAUs initially with the potential to scale to 1M DAUs.

## System Architecture

### High-Level Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ - Notification  │    │ - Event Router  │    │ - Users         │
│   Dashboard     │    │ - Notification  │    │ - Events        │
│ - Event Trigger │    │   Processor     │    │ - Notifications │
│ - Real-time UI  │    │ - REST API      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Event Generation**: User performs action (like, follow, comment) → Event created
2. **Event Processing**: Event processor determines affected users → Notifications generated
3. **Storage**: Notifications stored in database with metadata
4. **Delivery**: Frontend polls for new notifications → Real-time updates

### Core Components

#### 1. Event System
- **Event Types**: LIKE, FOLLOW, COMMENT, POST_CREATE, MENTION
- **Event Schema**: 
  ```javascript
  {
    eventId: String,
    type: String,
    sourceUserId: String,
    targetUserId: String,
    data: Object,
    timestamp: Date
  }
  ```

#### 2. Notification Engine
- **Processor**: In-memory queue for immediate processing
- **Rules Engine**: Determines notification recipients based on relationships
- **Batching**: Groups similar notifications to reduce spam

#### 3. Database Schema

**Users Collection**:
```javascript
{
  userId: String,
  username: String,
  email: String,
  preferences: {
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    notificationTypes: [String]
  }
}
```

**Events Collection**:
```javascript
{
  eventId: String,
  type: String,
  sourceUserId: String,
  targetUserId: String,
  data: {
    postId: String,
    content: String,
    metadata: Object
  },
  timestamp: Date
}
```

**Notifications Collection**:
```javascript
{
  notificationId: String,
  userId: String,
  type: String,
  content: String,
  status: String, // 'unread', 'read', 'dismissed'
  relatedEventId: String,
  timestamp: Date
}
```

## API Design

### Endpoints

#### Events
- `POST /api/events` - Create new event
- `GET /api/events/:userId` - Get user's events

#### Notifications
- `GET /api/notifications/:userId` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

#### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id/preferences` - Update notification preferences

## Scale Considerations

### Current Scale (100 DAUs)
- **Simple Architecture**: Single server, MongoDB instance
- **Processing**: In-memory event queue
- **Real-time**: HTTP polling every 5 seconds
- **Storage**: Basic indexing on userId, timestamp

### Future Scale (1M DAUs)
- **Horizontal Scaling**: 
  - Load balancers for API servers
  - Database sharding by userId
  - Redis for caching and session management
- **Event Processing**: 
  - Message queue (RabbitMQ/Apache Kafka)
  - Microservices for different notification types
- **Real-time Updates**: 
  - WebSocket connections with connection pooling
  - Server-sent events for mobile apps
- **Performance Optimizations**:
  - CDN for static assets
  - Database read replicas
  - Notification aggregation and batching

## Performance Considerations

### Current Implementation
- **Response Time**: < 200ms for API calls
- **Throughput**: ~10 events/second
- **Storage**: ~1GB for 100K notifications

### Optimization Strategies
1. **Database Indexing**: userId, timestamp, status
2. **Caching**: User preferences, recent notifications
3. **Batching**: Group similar notifications
4. **Cleanup**: Archive old notifications (>30 days)

## Security & Privacy

- **Authentication**: JWT tokens for API access
- **Authorization**: User can only access own notifications
- **Data Privacy**: GDPR compliant notification preferences
- **Rate Limiting**: Prevent spam and abuse

## Limitations & Trade-offs

### Current Design Limitations
1. **Polling Overhead**: Frequent HTTP requests consume bandwidth
2. **Memory Usage**: In-memory queue limited by server RAM
3. **Single Point of Failure**: Monolithic architecture
4. **No Offline Support**: Notifications require active connection

### Acceptable Trade-offs for POC
1. **Simplified Auth**: No complex user management
2. **Basic UI**: Functional over aesthetic
3. **Limited Event Types**: Focus on core notification patterns
4. **No Email/Push**: Web notifications only

## Future Enhancements

1. **Real-time Communication**: WebSocket implementation
2. **Mobile Support**: Push notifications via FCM
3. **Analytics**: Notification engagement tracking
4. **ML Personalization**: Smart notification filtering
5. **Multi-channel**: Email, SMS, in-app notifications

## Technology Stack

### Frontend
- **React 18**: Component-based UI
- **Axios**: HTTP client for API calls
- **CSS Modules**: Scoped styling

### Backend
- **Node.js + Express**: REST API server
- **MongoDB + Mongoose**: NoSQL database with ODM
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment configuration

### DevOps
- **Development**: Local MongoDB, Node.js
- **Testing**: Jest for unit tests
- **Deployment**: Docker containers for production

## Monitoring & Observability

- **Logging**: Winston for structured logs
- **Metrics**: Event processing times, notification delivery rates
- **Health Checks**: API endpoint monitoring
- **Error Tracking**: Unhandled exception logging

## Conclusion

This design provides a solid foundation for Insyd's notification system, balancing simplicity for current needs with extensibility for future growth. The modular architecture allows for incremental improvements as the user base scales from 100 to 1M DAUs.