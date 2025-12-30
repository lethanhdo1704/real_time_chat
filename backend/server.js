// backend/server.js
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { createServer } from "http";
import "dotenv/config";

// ==========================
// ENV VALIDATION
// ==========================
import {
  validateEnv,
  getEnvConfig,
  displayEnvConfig,
} from "./config/validateEnv.js";

validateEnv();
const config = getEnvConfig();
displayEnvConfig();

// ==========================
// MIDDLEWARE IMPORTS
// ==========================
import auth from "./middleware/auth.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  globalLimiter,
  authLimiter,
  otpLimiter,
  friendRequestLimiter,
} from "./middleware/rateLimit.js";

// ==========================
// ROUTES
// ==========================
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import otpForgotRoutes from "./routes/otp/forgot.routes.js";
import otpRegisterRoutes from "./routes/otp/register.routes.js";
import friendsRoutes from "./routes/friend.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

// ==========================
// SOCKET
// ==========================
import initSocket from "./socket/index.js";

const app = express();

// ==========================
// CORS CONFIGURATION
// ==========================
const allowedOrigins =
  config.nodeEnv === "production"
    ? [config.corsOrigin]
    : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: true, // ✅ allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);


// ==========================
// GLOBAL MIDDLEWARE
// ==========================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize input
app.use((req, res, next) => {
  if (req.body) sanitizeInput(req, res, next);
  else next();
});

// ==========================
// RATE LIMITING (PROD ONLY)
// ==========================
if (config.nodeEnv === "production") {
  app.use(globalLimiter);
  console.log("✅ Global rate limiting enabled (production)");
}

// ==========================
// DATABASE
// ==========================
connectDB();

// ==========================
// HEALTH CHECK
// ==========================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    features: config.features,
  });
});

// ==========================
// API ROUTES
// ==========================

// Public routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/otp/forgot", otpLimiter, otpForgotRoutes);
app.use("/api/otp/register", otpLimiter, otpRegisterRoutes);

// Protected routes
app.use("/api/users", auth, userRoutes);
app.use("/api/friends", auth, friendRequestLimiter, friendsRoutes);
app.use("/api/conversations", auth, conversationRoutes);
app.use("/api/messages", auth, messageRoutes);

console.log("✅ All routes registered");

// ==========================
// ERROR HANDLING
// ==========================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================
// SERVER & SOCKET
// ==========================
const PORT = config.port;
const server = createServer(app);

// Initialize Socket.IO with SocketEmitter and chat handlers
// initSocket() returns { io, socketEmitter }
const { io, socketEmitter } = initSocket(server);

// Make available to app
app.set("socketEmitter", socketEmitter);
app.set("io", io);

console.log("✅ Socket.IO initialized");
console.log("✅ SocketEmitter service ready");
console.log("✅ Chat socket handlers ready");

// ==========================
// START SERVER
// ==========================
server.listen(PORT, '0.0.0.0', () => {
  console.log("\n" + "=".repeat(50));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.1.2:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔌 Socket.IO ready`);
  console.log(`💬 Chat system ready`);
  console.log("=".repeat(50) + "\n");
});

// ==========================
// GRACEFUL SHUTDOWN
// ==========================
const shutdown = (signal) => {
  console.log(`\n👋 ${signal} received: shutting down gracefully...`);
  
  // Close server
  server.close(() => {
    console.log("✅ HTTP server closed");
    
    // Close socket connections
    io.close(() => {
      console.log("✅ Socket.IO closed");
      process.exit(0);
    });
  });

  // Force close after 10s
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

export default app;