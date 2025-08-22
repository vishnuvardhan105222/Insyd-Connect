# Insyd Notification Backend

Backend API server for the Insyd notification system POC.

## Setup Instructions

### Prerequisites
- Node.js 16+ 
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/insyd-notifications
NODE_ENV=development
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

### API Endpoints

#### Events
- `POST /api/events` - Create new event
- `GET /api/events/:userId` - Get user's events

#### Notifications  
- `GET /api/notifications/:userId` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

#### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id/preferences` - Update notification preferences

### Testing

Run tests:
```bash
npm test
```

### Database Setup

The application will automatically create the required collections when you first run it. Sample data will be seeded for testing.

### Architecture

- **server.js** - Main application entry point
- **models/** - Mongoose schemas for Users, Events, Notifications
- **routes/** - Express route handlers
- **middleware/** - Custom middleware functions
- **services/** - Business logic and notification processing
- **config/** - Database and application configuration

### Sample API Usage

Create an event:
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LIKE",
    "sourceUserId": "user1",
    "targetUserId": "user2",
    "data": { "postId": "post123" }
  }'
```

Get notifications:
```bash
curl http://localhost:5000/api/notifications/user2
```