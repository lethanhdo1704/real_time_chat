# 💬 Real-time Chat Application

A modern, full-stack real-time chat application built with React, Node.js, Socket.IO, and MongoDB. Features include one-on-one messaging, friend management, typing indicators, message status tracking, and more.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

---

## ✨ Features

### 🔐 Authentication & Security
- User registration with email verification (OTP)
- Secure login with JWT tokens
- Password reset via email OTP
- Google reCAPTCHA integration
- Rate limiting for API endpoints
- Input sanitization and validation

### 💬 Real-time Messaging
- One-on-one private conversations
- Real-time message delivery with Socket.IO
- Message status tracking (sent, delivered, read)
- Typing indicators
- Emoji support with custom picker
- Message timestamps
- Unread message counts
- Auto-scroll to latest messages

### 👥 Friend Management
- Send/accept/reject friend requests
- Real-time friend request notifications
- Friend list management
- Search users by email
- Unseen request count badges
- Friend status indicators (online/offline)

### 🎨 User Interface
- Modern, responsive design
- Light/Dark mode support (via Tailwind)
- Smooth animations and transitions
- Empty state illustrations
- Copy-to-clipboard functionality
- Internationalization (i18n) - English & Vietnamese
- Toast notifications

### 🚀 Performance & Optimization
- Conversation state management with Zustand
- Message caching and pagination
- Optimistic UI updates
- Lazy loading conversations
- Socket connection management
- Request rate limiting

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.0.3
- **State Management**: Zustand 5.0.2
- **Routing**: React Router DOM 7.1.1
- **Styling**: Tailwind CSS 3.4.17
- **Real-time**: Socket.IO Client 4.8.1
- **HTTP Client**: Axios 1.7.9
- **Internationalization**: i18next 23.16.8
- **UI Components**: Lucide React (icons), Emoji Picker React

### Backend
- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js 4.21.2
- **Database**: MongoDB with Mongoose 8.9.3
- **Real-time**: Socket.IO 4.8.1
- **Authentication**: JSON Web Tokens (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Email**: Nodemailer 6.9.16
- **File Upload**: Multer 1.4.5-lts.1
- **Validation**: express-validator 7.2.0
- **Security**: 
  - express-rate-limit 7.5.0
  - express-mongo-sanitize 2.2.0
  - helmet 8.0.0
  - cors 2.8.5

---

## 📁 Project Structure

```
.
├── backend/
│   ├── config/              # Database & environment config
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Auth, validation, error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── socket/             # Socket.IO handlers
│   └── utils/              # Helper functions
│
└── frontend/
    ├── public/             # Static assets
    └── src/
        ├── components/     # React components
        ├── context/        # React context providers
        ├── hooks/          # Custom React hooks
        ├── i18n/           # Translations
        ├── pages/          # Page components
        ├── services/       # API & Socket services
        ├── store/          # Zustand stores
        ├── styles/         # Global styles
        └── utils/          # Helper functions
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- MongoDB (local or Atlas)
- npm or yarn
- Google reCAPTCHA keys (for production)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd chat-application
```

2. **Backend Setup**
```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/chat-app

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

Create `.env` file in `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

### Running the Application

1. **Start MongoDB** (if running locally)
```bash
mongod
```

2. **Start Backend**
```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

Backend will run on `http://localhost:5000`

3. **Start Frontend**
```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify registration OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Password Recovery
- `POST /api/otp/forgot/send-otp` - Send password reset OTP
- `POST /api/otp/forgot/verify-otp` - Verify reset OTP
- `POST /api/otp/forgot/reset-password` - Reset password

### Friends
- `GET /api/friends` - Get friends list
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:uid` - Accept friend request
- `POST /api/friends/reject/:uid` - Reject friend request
- `DELETE /api/friends/cancel/:uid` - Cancel sent request
- `DELETE /api/friends/remove/:uid` - Remove friend
- `GET /api/friends/unseen-count` - Get unseen requests count
- `POST /api/friends/mark-seen` - Mark requests as seen

### Conversations
- `GET /api/conversations` - Get user's conversations
- `GET /api/conversations/:id` - Get conversation details
- `POST /api/conversations/:id/read` - Mark conversation as read

### Messages
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message

### Users
- `GET /api/users/search` - Search users by email

---

## 🔌 Socket.IO Events

### Client → Server
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `message_read` - Mark message as read

### Server → Client
- `message_received` - New message received
- `message_sent` - Message sent confirmation
- `message_read` - Message read by recipient
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `friend_request_received` - New friend request
- `friend_request_accepted` - Friend request accepted
- `friend_request_rejected` - Friend request rejected
- `friend_request_cancelled` - Friend request cancelled
- `friend_added` - Friend successfully added
- `friend_removed` - Friend removed
- `user_online` - Friend came online
- `user_offline` - Friend went offline

---

## 🗄️ Database Schema

### User
```javascript
{
  uid: String (unique),
  nickname: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  isVerified: Boolean,
  createdAt: Date
}
```

### Friend
```javascript
{
  uid1: String,
  uid2: String,
  status: Enum ['PENDING', 'ACCEPTED', 'REJECTED'],
  initiator: String,
  seenAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation
```javascript
{
  type: Enum ['ONE_TO_ONE', 'GROUP'],
  participants: [String],
  lastMessage: String,
  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Message
```javascript
{
  conversation: ObjectId,
  sender: String,
  content: String,
  type: Enum ['TEXT', 'IMAGE', 'FILE'],
  readBy: [String],
  deletedBy: [String],
  createdAt: Date
}
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Sanitization**: Prevents XSS and injection
- **MongoDB Sanitization**: Prevents NoSQL injection
- **CORS**: Configured for specific origins
- **Helmet**: Security headers
- **OTP Verification**: Email verification system
- **Socket Authentication**: JWT validation for WebSocket

---

## 🌐 Internationalization

The app supports multiple languages:
- English (en)
- Vietnamese (vi)

Translation files located in `frontend/src/i18n/locales/`

---

## 🎨 Key Features Implementation

### Real-time Updates
- Socket.IO connection managed via Context API
- Automatic reconnection on disconnect
- Event-driven architecture for all real-time features
- Optimistic UI updates for instant feedback

### State Management
- **Zustand** for global state (chat, friends)
- Persistent conversation history
- Message caching to reduce API calls
- Friend list caching with TTL

### Performance Optimizations
- Lazy loading of conversations
- Message pagination
- Debounced typing indicators
- Memoized components
- Request deduplication

---

## 📝 Environment Variables

### Backend Required Variables
```env
PORT                    # Server port
MONGODB_URI            # MongoDB connection string
JWT_SECRET             # JWT signing secret
JWT_EXPIRES_IN         # Token expiration time
EMAIL_USER             # SMTP email username
EMAIL_PASS             # SMTP email password
FRONTEND_URL           # Frontend URL for CORS
RECAPTCHA_SECRET_KEY   # Google reCAPTCHA secret
```

### Frontend Required Variables
```env
VITE_API_URL              # Backend API URL
VITE_RECAPTCHA_SITE_KEY   # Google reCAPTCHA site key
```

---

## 🐛 Known Issues & Limitations

- Group chat feature is in development (UI present but not functional)
- File/image upload not yet implemented for messages
- No message editing capability
- No message search functionality
- Browser notification permissions required for friend requests

---

## 🚧 Future Enhancements

- [ ] Group chat implementation
- [ ] File and image sharing in messages
- [ ] Message reactions (emoji)
- [ ] Message forwarding
- [ ] User profile customization
- [ ] Voice/video calling
- [ ] Message search
- [ ] Chat export functionality
- [ ] Advanced friend management (blocking, favorites)
- [ ] Read receipts toggle
- [ ] Custom chat themes

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Developer Notes

### Running in Development Mode

**Backend with auto-reload:**
```bash
cd backend
npm run dev  # Uses nodemon
```

**Frontend with HMR:**
```bash
cd frontend
npm run dev  # Vite HMR enabled
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Output in dist/
```

**Backend:**
```bash
cd backend
npm start
```

### Code Style
- ESLint configured for both frontend and backend
- Run `npm run lint` to check for issues

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [realtimechatotp@gmail.com]

---

## 🙏 Acknowledgments

- Socket.IO team for excellent real-time capabilities
- Tailwind CSS for utility-first styling
- Zustand for simple state management
- All open-source contributors

---

**Made with ❤️ by [Lê Thành Đô]**
