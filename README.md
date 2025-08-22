# Insyd Notification System POC

A complete proof-of-concept notification system for Insyd, the social platform for the Architecture Industry.

## 🏗️ Architecture Overview

This POC demonstrates a scalable notification system with:
- **Frontend**: React + TypeScript (runs in Lovable)
- **Backend**: Node.js + Express + MongoDB (separate setup)
- **Real-time**: Polling-based notifications with queue processing

## 📁 Project Structure

```
insyd-notification-poc/
├── SYSTEM_DESIGN.md           # Complete system design document
├── backend/                   # Node.js backend (separate setup)
│   ├── package.json
│   ├── server.js             # Main server
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   └── README.md             # Backend setup guide
└── src/                      # React frontend (current)
    ├── pages/Index.tsx       # Main notification dashboard
    └── components/           # UI components
```

## 🚀 Quick Start

### Frontend (Current - Lovable)
The frontend is already running! It shows:
- Live notification dashboard
- Event trigger simulation  
- Beautiful dark theme with Insyd branding

### Backend Setup
1. **Navigate to backend folder** (outside Lovable):
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

2. **Configure MongoDB** in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/insyd-notifications
   PORT=5000
   ```

3. **Start backend**:
   ```bash
   npm run dev
   ```

4. **Test API**:
   ```bash
   # Create event
   curl -X POST http://localhost:5000/api/events \
     -H "Content-Type: application/json" \
     -d '{"type": "LIKE", "sourceUserId": "user1", "targetUserId": "user2"}'
   
   # Get notifications  
   curl http://localhost:5000/api/notifications/user2
   ```

## 🎯 Key Features Demonstrated

- **Event Processing**: Real-time event creation and notification generation
- **Smart Routing**: Notifications sent to relevant users based on relationships
- **Status Management**: Read/unread notification tracking
- **Scalable Design**: Queue-based processing for high throughput
- **Beautiful UI**: Modern interface with real-time updates

## 📊 System Design

See `SYSTEM_DESIGN.md` for complete technical specifications including:
- Component architecture
- Data flow diagrams  
- Scaling strategies (100 DAUs → 1M DAUs)
- Performance considerations
- API documentation

## 🧪 Sample Data

The backend automatically seeds with sample users and notifications for testing:
- `user1` (alex_architect) - 3 notifications
- `user2` (priya_designer) - 2 notifications  
- Ready-to-test API endpoints

## 🔄 Real-time Flow

1. **User Action** → Event created via API
2. **Event Processor** → Determines notification recipients  
3. **Notification Storage** → MongoDB with indexes
4. **Frontend Polling** → Updates UI every 5 seconds
5. **User Interaction** → Mark read/unread via API

---

**Built for Insyd** - Connecting the Architecture Industry 🏗️