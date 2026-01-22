# 💬 Real-time Chat Application

## 🔗 Website
### 👉 https://realtimechat.online

A comprehensive, feature-rich real-time chat application with WebRTC video/audio calling, built with modern web technologies. This application provides instant messaging, file sharing, friend management, and peer-to-peer calling capabilities.

## ✨ Key Features

### 🎯 Core Chat Features
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **Private & Group Conversations**: One-on-one and group chat support
- **Message Management**: 
  - Edit and recall messages
  - Delete for me or for everyone (admin)
  - Hide messages functionality
  - Message reactions with emoji
- **File Sharing**: Upload and share images, videos, audio files, and documents
- **Message Status**: Delivered, read receipts, and typing indicators
- **Unread Message Tracking**: Smart notification system
- **Reply to Messages**: Quote and reply to specific messages
- **Message History**: Persistent storage with pagination

### 📞 Video/Audio Calling
- **WebRTC Integration**: Peer-to-peer video and audio calls
- **Call Management**: Incoming/outgoing call modals
- **Call Controls**: Mute, video toggle, end call
- **ICE Candidate Handling**: Reliable connection establishment

### 👥 Social Features
- **Friend System**: Send, accept, decline friend requests
- **Friend List Management**: Organized friend contacts
- **Group Management**: Create and manage group conversations
- **Online Status**: Real-time presence indicators
- **User Profiles**: Customizable avatars and profile information

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based auth
- **OTP Verification**: Two-factor authentication for registration and password reset
- **Email Integration**: OTP delivery via email
- **Password Recovery**: Secure forgot password flow
- **Rate Limiting**: Protection against abuse
- **Input Sanitization**: XSS and injection prevention
- **reCAPTCHA Integration**: Bot protection

### 🌍 Additional Features
- **Internationalization (i18n)**: Multi-language support (English & Vietnamese)
- **Responsive Design**: Seamless experience across all devices
- **Avatar Management**: Upload, crop, and customize profile pictures
- **Cloudflare R2 Storage**: Efficient file and media storage
- **Dark/Light Mode Ready**: Theme support infrastructure
- **Legal Pages**: Terms of Service, Privacy Policy, Cookies Policy

## 🚀 Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Next-generation frontend tooling
- **Zustand** - Lightweight state management
- **Socket.IO Client** - Real-time bidirectional communication
- **WebRTC** - Peer-to-peer video/audio calling
- **Axios** - HTTP client for API requests
- **i18next** - Internationalization framework
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Emoji Picker** - Rich emoji support

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Fast, minimalist web framework
- **Socket.IO** - WebSocket implementation
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Multer** - File upload middleware
- **Nodemailer** - Email sending
- **Cloudflare R2** - Object storage
- **Express Rate Limit** - API rate limiting
- **Express Validator** - Input validation and sanitization

## 📋 Prerequisites

Ensure you have the following installed:
- **Node.js** v16 or higher
- **npm** or **yarn**
- **MongoDB** v4.4 or higher (local or MongoDB Atlas)
- **Cloudflare R2 Account** (for file storage)
- **SMTP Email Service** (for OTP emails)
- **reCAPTCHA Keys** (Google reCAPTCHA)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/lethanhdo1704/real_time_chat.git
cd real_time_chat
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/realtime_chat
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/realtime_chat

# JWT Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRE=7d

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourchatapp.com

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-r2-public-url.com

# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

## 🎯 Running the Application

### Start Backend Server
```bash
cd backend
npm start

# For development with auto-reload
npm run dev
```

Backend server will run on `http://localhost:5000`

### Start Frontend Application
```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
real_time_chat/
│
├── backend/
│   ├── config/                      # Configuration files
│   │   ├── db.js                   # MongoDB connection
│   │   └── validateEnv.js          # Environment validation
│   │
│   ├── controllers/                 # Request handlers
│   │   ├── avatar.controller.js    # Avatar upload/management
│   │   ├── call.controller.js      # Video/audio call logic
│   │   ├── conversation.controller.js
│   │   ├── friend.controller.js    # Friend requests/management
│   │   ├── message.controller.js   # Message operations
│   │   ├── upload.controller.js    # File upload handling
│   │   └── user.controller.js      # User management
│   │
│   ├── middleware/                  # Custom middleware
│   │   ├── auth.js                 # JWT authentication
│   │   ├── conversation.middleware.js
│   │   ├── errorHandler.js         # Global error handling
│   │   ├── rateLimit.js            # Rate limiting
│   │   ├── sanitize.js             # Input sanitization
│   │   └── uploadAvatar.js         # Avatar upload middleware
│   │
│   ├── models/                      # Database schemas
│   │   ├── Call.js                 # Call records
│   │   ├── Conversation.js         # Conversation model
│   │   ├── ConversationMember.js   # Conversation participants
│   │   ├── Friend.js               # Friend relationships
│   │   ├── Message.js              # Message model
│   │   ├── OTP.js                  # OTP verification
│   │   └── User.js                 # User model
│   │
│   ├── routes/                      # API routes
│   │   ├── auth.routes.js          # Authentication routes
│   │   ├── call.routes.js          # Call management routes
│   │   ├── conversation.routes.js  # Conversation routes
│   │   ├── friend.routes.js        # Friend management routes
│   │   ├── message.routes.js       # Message routes
│   │   ├── reaction.routes.js      # Reaction routes
│   │   ├── upload.routes.js        # File upload routes
│   │   ├── users.routes.js         # User routes
│   │   └── otp/                    # OTP routes
│   │       ├── forgot.routes.js    # Password reset OTP
│   │       └── register.routes.js  # Registration OTP
│   │
│   ├── services/                    # Business logic
│   │   ├── avatar.service.js       # Avatar processing
│   │   ├── call.service.js         # Call management
│   │   ├── fileUpload.service.js   # File handling
│   │   ├── friend.service.js       # Friend operations
│   │   ├── friendEmitter.service.js # Friend socket events
│   │   ├── socketEmitter.service.js # Socket event emitter
│   │   ├── conversation/           # Conversation services
│   │   │   ├── conversation.create.js
│   │   │   ├── conversation.member.js
│   │   │   ├── conversation.query.js
│   │   │   ├── conversation.read.js
│   │   │   └── conversation.service.js
│   │   ├── message/                # Message services
│   │   │   ├── conversation.helper.js
│   │   │   ├── message.creator.js
│   │   │   ├── message.service.js
│   │   │   ├── unread.manager.js
│   │   │   ├── validators.js
│   │   │   └── usecases/           # Message use cases
│   │   │       ├── adminDeleteMessage.js
│   │   │       ├── deleteForMe.js
│   │   │       ├── editMessage.js
│   │   │       ├── getLastMessages.js
│   │   │       ├── getMessages.js
│   │   │       ├── hideMessage.js
│   │   │       ├── markAsRead.js
│   │   │       ├── recallMessage.js
│   │   │       ├── sendMessage.js
│   │   │       └── toggleReaction.js
│   │   └── storage/
│   │       └── r2.service.js       # Cloudflare R2 integration
│   │
│   ├── socket/                      # WebSocket handlers
│   │   ├── call.socket.js          # Call signaling
│   │   ├── chat.socket.js          # Chat events
│   │   ├── friend.socket.js        # Friend events
│   │   └── index.js                # Socket.IO setup
│   │
│   ├── utils/                       # Utility functions
│   │   ├── recaptcha.js            # reCAPTCHA verification
│   │   ├── validate.js             # Validation helpers
│   │   └── email/                  # Email templates
│   │       ├── emailForgotPassword.js
│   │       └── emailRegister.js
│   │
│   ├── .env                         # Environment variables
│   ├── package.json
│   └── server.js                    # Entry point
│
├── frontend/
│   ├── public/                      # Static assets
│   │   ├── Banner_chat.svg
│   │   └── Logo_chat.svg
│   │
│   ├── src/
│   │   ├── user/
│   │   │   ├── components/          # React components
│   │   │   │   ├── Call/           # Video/audio call UI
│   │   │   │   │   ├── CallControls.jsx
│   │   │   │   │   ├── CallManager.jsx
│   │   │   │   │   ├── CallScreen.jsx
│   │   │   │   │   ├── IncomingCallModal.jsx
│   │   │   │   │   └── OutgoingCallModal.jsx
│   │   │   │   │
│   │   │   │   ├── Chat/           # Chat interface
│   │   │   │   │   ├── ChatEmptyState.jsx
│   │   │   │   │   ├── ChatHeader.jsx
│   │   │   │   │   ├── ConversationItem.jsx
│   │   │   │   │   ├── EmojiPicker.jsx
│   │   │   │   │   ├── MessageList.jsx
│   │   │   │   │   ├── ChatInput/  # Message input
│   │   │   │   │   ├── ChatWindow/ # Main chat window
│   │   │   │   │   ├── FileUpload/ # File handling
│   │   │   │   │   └── MessageItem/ # Message display
│   │   │   │   │       ├── MessageBubble.jsx
│   │   │   │   │       ├── MessageReactions.jsx
│   │   │   │   │       ├── MessageStatus.jsx
│   │   │   │   │       ├── FileUpload/ # Media attachments
│   │   │   │   │       └── MessageActions/ # Edit/delete/recall
│   │   │   │   │
│   │   │   │   ├── common/         # Shared components
│   │   │   │   │   ├── AvatarImage.jsx
│   │   │   │   │   ├── CountdownTimer.jsx
│   │   │   │   │   ├── EmailWithOTP.jsx
│   │   │   │   │   ├── ErrorMessage.jsx
│   │   │   │   │   ├── OTPInput.jsx
│   │   │   │   │   ├── PasswordInput.jsx
│   │   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   │   └── SubmitButton.jsx
│   │   │   │   │
│   │   │   │   ├── ForgotPassword/ # Password reset
│   │   │   │   ├── FriendFeature/  # Friend management
│   │   │   │   │   ├── AddFriend.jsx
│   │   │   │   │   ├── FriendList.jsx
│   │   │   │   │   ├── FriendRequests.jsx
│   │   │   │   │   └── GroupList.jsx
│   │   │   │   │
│   │   │   │   ├── Home/           # Main layout
│   │   │   │   ├── Login/          # Login form
│   │   │   │   ├── Register/       # Registration form
│   │   │   │   └── Settings/       # User settings
│   │   │   │       ├── AvatarCropModal.jsx
│   │   │   │       ├── AvatarSection.jsx
│   │   │   │       └── ProfileInfoSection.jsx
│   │   │   │
│   │   │   ├── context/            # React context
│   │   │   │   ├── AuthContext.jsx
│   │   │   │   └── SocketContext.jsx
│   │   │   │
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   │   ├── auth/           # Authentication hooks
│   │   │   │   ├── call/           # Call hooks
│   │   │   │   ├── chat/           # Chat hooks
│   │   │   │   ├── friends/        # Friend hooks
│   │   │   │   ├── settings/       # Settings hooks
│   │   │   │   └── socket/         # Socket hooks
│   │   │   │
│   │   │   ├── i18n/               # Internationalization
│   │   │   │   └── locales/
│   │   │   │       ├── en/         # English translations
│   │   │   │       └── vi/         # Vietnamese translations
│   │   │   │
│   │   │   ├── pages/              # Page components
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── NotFound.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── Settings.jsx
│   │   │   │   └── LegalPolicies/
│   │   │   │       ├── CookiesPolicy.jsx
│   │   │   │       ├── PrivacyPolicy.jsx
│   │   │   │       └── TermsOfService.jsx
│   │   │   │
│   │   │   ├── services/           # API services
│   │   │   │   ├── api.js          # Axios configuration
│   │   │   │   ├── chatApi.js      # Chat API calls
│   │   │   │   ├── friendService.js
│   │   │   │   ├── messageService.js
│   │   │   │   ├── socketService.js
│   │   │   │   ├── uploadService.js
│   │   │   │   ├── userService.js
│   │   │   │   └── socket/
│   │   │   │       └── call.socket.js
│   │   │   │
│   │   │   ├── store/              # State management (Zustand)
│   │   │   │   ├── friendStore.js
│   │   │   │   ├── call/
│   │   │   │   │   └── callStore.js
│   │   │   │   └── chat/
│   │   │   │       ├── chatStore.js
│   │   │   │       ├── conversationSlice.js
│   │   │   │       ├── messageSlice.js
│   │   │   │       ├── typingSlice.js
│   │   │   │       └── userSlice.js
│   │   │   │
│   │   │   ├── styles/             # CSS files
│   │   │   │   ├── animations.css
│   │   │   │   └── index.css
│   │   │   │
│   │   │   ├── utils/              # Utility functions
│   │   │   │   ├── avatarUtils.js
│   │   │   │   ├── emoji.js
│   │   │   │   ├── formatLastSeen.js
│   │   │   │   ├── renderMessage.jsx
│   │   │   │   ├── setViewportHeight.js
│   │   │   │   └── call/
│   │   │   │
│   │   │   └── webrtc/             # WebRTC functionality
│   │   │       ├── iceQueue.js
│   │   │       ├── mediaDevices.js
│   │   │       └── peerConnection.js
│   │   │
│   │   ├── App.jsx                  # Root component
│   │   └── main.jsx                 # Entry point
│   │
│   ├── .env                         # Environment variables
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   └── vite.config.js
│
├── .gitignore
├── eslint.config.js
└── README.md
```

## 🔧 API Endpoints

### Authentication
```
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # User login
POST   /api/auth/logout                # User logout
GET    /api/auth/me                    # Get current user
POST   /api/auth/refresh               # Refresh JWT token
```

### OTP (One-Time Password)
```
POST   /api/otp/register/send          # Send registration OTP
POST   /api/otp/register/verify        # Verify registration OTP
POST   /api/otp/forgot/send            # Send password reset OTP
POST   /api/otp/forgot/verify          # Verify password reset OTP
POST   /api/otp/forgot/reset           # Reset password
```

### Users
```
GET    /api/users                      # Get all users
GET    /api/users/:id                  # Get user by ID
PUT    /api/users/:id                  # Update user profile
DELETE /api/users/:id                  # Delete user account
GET    /api/users/search               # Search users
```

### Friends
```
GET    /api/friends                    # Get friend list
POST   /api/friends/request            # Send friend request
GET    /api/friends/requests           # Get pending requests
PUT    /api/friends/accept/:id         # Accept friend request
PUT    /api/friends/decline/:id        # Decline friend request
DELETE /api/friends/:id                # Remove friend
GET    /api/friends/suggestions        # Get friend suggestions
```

### Conversations
```
GET    /api/conversations              # Get user's conversations
POST   /api/conversations              # Create new conversation
GET    /api/conversations/:id          # Get conversation details
PUT    /api/conversations/:id          # Update conversation
DELETE /api/conversations/:id          # Delete conversation
POST   /api/conversations/:id/members  # Add members to group
DELETE /api/conversations/:id/members/:userId # Remove member
PUT    /api/conversations/:id/read     # Mark conversation as read
```

### Messages
```
GET    /api/messages/:conversationId   # Get messages (paginated)
POST   /api/messages                   # Send new message
PUT    /api/messages/:id               # Edit message
DELETE /api/messages/:id               # Delete message for me
POST   /api/messages/:id/recall        # Recall message (delete for everyone)
POST   /api/messages/:id/hide          # Hide message
POST   /api/messages/:id/admin-delete  # Admin delete message
GET    /api/messages/last              # Get last message per conversation
POST   /api/messages/:id/read          # Mark message as read
```

### Reactions
```
POST   /api/reactions/:messageId       # Toggle reaction on message
GET    /api/reactions/:messageId       # Get reactions for message
DELETE /api/reactions/:messageId       # Remove reaction
```

### File Upload
```
POST   /api/upload/file                # Upload file (image/video/audio/document)
POST   /api/upload/avatar              # Upload avatar
DELETE /api/upload/:fileId             # Delete uploaded file
```

### Calls
```
POST   /api/calls/initiate             # Initiate call
POST   /api/calls/:id/accept           # Accept incoming call
POST   /api/calls/:id/decline          # Decline call
POST   /api/calls/:id/end              # End call
GET    /api/calls/history              # Get call history
```

## 🔌 Socket.IO Events

### Connection Events
```javascript
// Client → Server
socket.emit('user_online', { userId })
socket.emit('user_offline', { userId })

// Server → Client
socket.on('user_status_changed', { userId, status })
```

### Chat Events
```javascript
// Client → Server
socket.emit('join_conversation', { conversationId })
socket.emit('leave_conversation', { conversationId })
socket.emit('send_message', { conversationId, message })
socket.emit('typing_start', { conversationId, userId })
socket.emit('typing_stop', { conversationId, userId })
socket.emit('message_read', { conversationId, messageId })

// Server → Client
socket.on('receive_message', { message })
socket.on('message_edited', { messageId, newContent })
socket.on('message_deleted', { messageId })
socket.on('message_recalled', { messageId })
socket.on('message_hidden', { messageId })
socket.on('message_reaction', { messageId, reaction })
socket.on('typing_indicator', { conversationId, users })
socket.on('message_delivered', { messageId })
socket.on('message_read_receipt', { messageId, userId })
```

### Friend Events
```javascript
// Client → Server
socket.emit('friend_request_sent', { toUserId })

// Server → Client
socket.on('friend_request_received', { fromUser })
socket.on('friend_request_accepted', { userId })
socket.on('friend_request_declined', { userId })
socket.on('friend_removed', { userId })
socket.on('friend_online', { userId })
socket.on('friend_offline', { userId })
```

### Call Events (WebRTC Signaling)
```javascript
// Client → Server
socket.emit('call_initiate', { to, offer, callType })
socket.emit('call_answer', { to, answer })
socket.emit('call_ice_candidate', { to, candidate })
socket.emit('call_end', { callId })

// Server → Client
socket.on('incoming_call', { from, offer, callType })
socket.on('call_answered', { answer })
socket.on('call_ice_candidate', { candidate })
socket.on('call_ended', { callId, reason })
socket.on('call_declined', { callId })
socket.on('call_busy', { callId })
```

## 🎨 Features in Detail

### Message Management
- **Send Message**: Text, emojis, and file attachments
- **Edit Message**: Modify sent messages (with edit indicator)
- **Recall Message**: Delete message for everyone
- **Delete for Me**: Remove message from your view only
- **Hide Message**: Hide message without deleting
- **Reply to Message**: Quote and reply functionality
- **Reactions**: Add emoji reactions to messages
- **Read Receipts**: See when messages are delivered and read

### File Handling
- **Supported Types**: Images (JPG, PNG, GIF), Videos (MP4, WebM), Audio (MP3, WAV), Documents (PDF, DOC, TXT)
- **Upload Progress**: Real-time upload progress tracking
- **File Preview**: Preview before sending
- **Cloud Storage**: Files stored in Cloudflare R2
- **Compression**: Automatic image compression

### Video/Audio Calling
- **WebRTC**: Peer-to-peer connection for low latency
- **Call Types**: Video and audio calls
- **Call Controls**: Mute/unmute, camera on/off, end call
- **Call Status**: Ringing, connecting, connected, ended
- **ICE Candidates**: Reliable connection establishment
- **Call History**: Track past calls

### Friend System
- **Search Users**: Find users by name or email
- **Send Requests**: Send friend requests with optional message
- **Accept/Decline**: Manage incoming requests
- **Friend List**: Organized list of friends
- **Online Status**: See which friends are online
- **Block Users**: (If implemented) Block unwanted users

## 🌐 Internationalization

The application supports multiple languages through i18next:

- **English (en)** - Default language
- **Vietnamese (vi)** - Vietnamese translation

Translation files are located in:
- `frontend/src/user/i18n/locales/en/pages/`
- `frontend/src/user/i18n/locales/vi/pages/`

To add a new language:
1. Create a new folder in `locales/` (e.g., `locales/fr/`)
2. Copy JSON files from `en/` folder
3. Translate the content
4. Update `i18n/index.js` to include the new language

## 🔒 Security Best Practices

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Sanitization**: XSS and SQL injection prevention
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **CORS**: Configured for specific origins
- **Helmet**: Security headers for Express
- **Environment Variables**: Sensitive data in .env files
- **OTP Verification**: Two-factor authentication
- **reCAPTCHA**: Bot protection on forms
- **File Validation**: Type and size validation for uploads

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
```

### Frontend
```bash
cd frontend
npm run build
# Build output will be in frontend/dist/
```

## 🚀 Deployment

### Backend Deployment (Railway/Render/Heroku)

1. **Prepare for deployment**:
   - Ensure all environment variables are set
   - Update `package.json` scripts if needed

2. **Railway deployment**:
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

3. **Environment variables**: Set all variables in your hosting platform dashboard

### Frontend Deployment (Vercel/Netlify)

1. **Build the project**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Vercel deployment**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Netlify deployment**:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables

### Database
- Use MongoDB Atlas for production database
- Enable IP whitelist and authentication
- Regular backups recommended

### File Storage
- Configure Cloudflare R2 bucket
- Set proper CORS policies
- Enable CDN for faster delivery

## 🔍 Environment Variables Reference

### Backend Required Variables
```
PORT                    # Server port (default: 5000)
NODE_ENV               # Environment (development/production)
CLIENT_URL             # Frontend URL for CORS
MONGODB_URI            # MongoDB connection string
JWT_SECRET             # JWT secret key (min 32 chars)
JWT_EXPIRE             # JWT expiration (e.g., 7d)
EMAIL_HOST             # SMTP host
EMAIL_PORT             # SMTP port
EMAIL_USER             # Email username
EMAIL_PASSWORD         # Email password
EMAIL_FROM             # Sender email address
R2_ACCOUNT_ID          # Cloudflare R2 account ID
R2_ACCESS_KEY_ID       # R2 access key
R2_SECRET_ACCESS_KEY   # R2 secret key
R2_BUCKET_NAME         # R2 bucket name
R2_PUBLIC_URL          # R2 public URL
RECAPTCHA_SECRET_KEY   # Google reCAPTCHA secret
```

### Frontend Required Variables
```
VITE_API_URL              # Backend API URL
VITE_SOCKET_URL           # Socket.IO server URL
VITE_RECAPTCHA_SITE_KEY   # Google reCAPTCHA site key
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Coding Standards
- Follow ESLint configuration
- Write clean, documented code
- Add comments for complex logic
- Follow existing code structure
- Test your changes before submitting

### Commit Message Convention
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test
