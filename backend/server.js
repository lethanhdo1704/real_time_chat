// backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
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
import adminAuth from "./middleware/admin/admin.Auth.js"; // ✅ ADMIN AUTH
import { sanitizeInput } from "./middleware/sanitize.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  globalLimiter,
  authLimiter,
  otpLimiter,
  friendRequestLimiter,
  adminLoginLimiter, // ✅ ADMIN LOGIN LIMITER
  adminApiLimiter,   // ✅ ADMIN API LIMITER
} from "./middleware/rateLimit.js";

// ==========================
// ROUTES
// ==========================
// User routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import otpForgotRoutes from "./routes/otp/forgot.routes.js";
import otpRegisterRoutes from "./routes/otp/register.routes.js";
import friendsRoutes from "./routes/friend.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import reactionRoutes from "./routes/reaction.routes.js";
import callRoutes from "./routes/call.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import groupRoutes from "./routes/group.routes.js";

// ✅ Admin routes
import adminAuthRoutes from "./routes/admin/auth.routes.js";
import adminUserRoutes from "./routes/admin/users.routes.js"; 
// ==========================
// SOCKET
// ==========================
import initSocket from "./socket/index.js";

// ==========================
// ES MODULE HELPERS
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================
// TRUST PROXY (QUAN TRỌNG cho IP whitelist)
// ==========================
// ✅ Bật trust proxy để lấy IP thật từ reverse proxy (nginx, cloudflare...)
app.set("trust proxy", true);

// ==========================
// CORS CONFIGURATION
// ==========================
app.use(
  cors({
    origin: true, // allow all origins (DEV)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// ==========================
// GLOBAL MIDDLEWARE
// ==========================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
// STATIC FILES - SERVE AVATARS
// ==========================
app.use(
  "/uploads/avatars",
  (req, res, next) => {
    res.set("Cache-Control", "public, max-age=86400");
    next();
  },
  express.static(path.join(__dirname, "uploads/avatars"))
);

console.log("✅ Static avatar serving configured");

// ==========================
// HEALTH CHECK
// ==========================
app.get("/health", (req, res) => {
  const start = process.hrtime.bigint();
  const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;

  res.status(200).json({
    status: "ok",
    latencyMs: latencyMs.toFixed(3),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    features: config.features,
  });
});

// ==========================
// API ROUTES - USER
// ==========================

// Public user routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/otp/forgot", otpLimiter, otpForgotRoutes);
app.use("/api/otp/register", otpLimiter, otpRegisterRoutes);

// Protected user routes
app.use("/api/users", auth, userRoutes);
app.use("/api/friends", auth, friendRequestLimiter, friendsRoutes);
app.use("/api/conversations", auth, conversationRoutes);
app.use("/api/messages", auth, messageRoutes);
app.use("/api/reactions", auth, reactionRoutes);
app.use("/api/calls", auth, callRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/groups", groupRoutes);

console.log("✅ User routes registered");

// ==========================
// API ROUTES - ADMIN
// ==========================

// ✅ Admin auth routes (public, có IP whitelist + rate limit riêng)
app.use("/api/admin/auth", adminAuthRoutes);

// ✅ Admin user management routes (protected)
app.use("/api/admin/users", adminAuth, adminApiLimiter, adminUserRoutes);
// ✅ Admin protected routes (sẽ thêm sau)
// app.use("/api/admin/users", adminAuth, adminApiLimiter, adminUserRoutes);
// app.use("/api/admin/reports", adminAuth, adminApiLimiter, adminReportRoutes);

console.log("✅ Admin routes registered");
console.log("✅ Admin routes registered");
// ==========================
// ERROR HANDLING
// ==========================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================
// SERVER & SOCKET
// ==========================
const PORT = config.port || 5000;

const server = createServer(app);

// Init Socket.IO (WebRTC signaling)
const { io, socketEmitter } = initSocket(server);

app.set("io", io);
app.set("socketEmitter", socketEmitter);

console.log("✅ Socket.IO initialized");
console.log("✅ Call signaling ready");

// ==========================
// START SERVER
// ==========================
server.listen(PORT, "0.0.0.0", () => {
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 Server running`);
  console.log(`➡️  Local:   http://localhost:${PORT}`);
  console.log(`➡️  Network: http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔌 Socket.IO ready`);
  console.log(`📞 WebRTC signaling ready`);
  console.log(`📁 Avatars: /uploads/avatars`);
  console.log(`📤 Upload: R2 ${config.r2.enabled ? "✅" : "❌"}`);
  console.log(`🔐 Trust Proxy: ✅ (IP whitelist enabled)`); // ✅ NEW
  console.log(`🛡️  Admin IP Whitelist: ${process.env.ADMIN_IP_WHITELIST ? "✅ Configured" : "⚠️  NOT configured"}`); // ✅ NEW
  console.log("=".repeat(60) + "\n");
});

// ==========================
// GRACEFUL SHUTDOWN
// ==========================
const shutdown = (signal) => {
  console.log(`\n👋 ${signal} received: shutting down gracefully...`);

  server.close(() => {
    console.log("✅ HTTP server closed");

    io.close(() => {
      console.log("✅ Socket.IO closed");
      process.exit(0);
    });
  });

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