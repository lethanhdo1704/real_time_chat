// backend/server.js (UPDATED - FULL VERSION)
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { createServer } from "http";
import "dotenv/config";

// ✅ NEW: Import validation and config
import { validateEnv, getEnvConfig, displayEnvConfig } from "./config/validateEnv.js";

// ✅ NEW: Validate environment before starting
validateEnv();
const config = getEnvConfig();
displayEnvConfig();

// Middleware
import auth from "./middleware/auth.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { 
  globalLimiter, 
  authLimiter, 
  otpLimiter,
  friendRequestLimiter 
} from "./middleware/rateLimit.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import otpForgotRoutes from "./routes/otp/forgot.js";
import otpRegisterRoutes from "./routes/otp/register.js";
import friendsRoutes from "./routes/friend.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

// Socket
import initSocket from "./socket/index.js";
import setupChatSocket from "./socket/chat.socket.js";

// ✅ NEW: Socket Emitter Service
import SocketEmitter from "./services/socketEmitter.service.js";

const app = express();

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = config.nodeEnv === 'production'
  ? [config.corsOrigin] // Production origin from env
  : ['http://localhost:5173', 'http://localhost:3000']; // Development origins

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ============================================
// GLOBAL MIDDLEWARE
// ============================================
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Apply global input sanitization
app.use(sanitizeInput);

// ✅ Apply rate limiting (only in production)
if (config.nodeEnv === 'production') {
  app.use(globalLimiter);
  console.log('✅ Rate limiting enabled');
}

// ============================================
// DATABASE CONNECTION
// ============================================
connectDB();

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    features: config.features
  });
});

// ============================================
// API ROUTES
// ============================================

// Public routes (no auth required)
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/otp/forgot", otpLimiter, otpForgotRoutes);
app.use("/api/otp/register", otpLimiter, otpRegisterRoutes);

// Protected routes (require auth)
app.use("/api/users", auth, userRoutes);
app.use("/api/friends", auth, friendRequestLimiter, friendsRoutes);
app.use("/api/conversations", auth, conversationRoutes);
app.use("/api/messages", auth, messageRoutes);

console.log("✅ All routes registered");

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// ============================================
// SERVER & SOCKET.IO SETUP
// ============================================
const PORT = config.port;
const server = createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// ✅ Setup Socket Emitter Service
const socketEmitter = new SocketEmitter(io);
app.set("socketEmitter", socketEmitter);
console.log('✅ Socket Emitter Service initialized');

// Setup chat socket handlers
setupChatSocket(io);

// Make io accessible (backward compatibility)
app.set("io", io);

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔌 Socket.IO ready`);
  console.log(`💬 Chat system ready`);
  console.log('='.repeat(50) + '\n');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// ============================================
// UNHANDLED REJECTIONS & EXCEPTIONS
// ============================================
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

export default app;