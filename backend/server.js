// backend/server.js
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { createServer } from "http";
import "dotenv/config";

// Middleware
import auth from "./middleware/auth.js"; // ✅ Import middleware riêng

// Routes
import authRoutes from "./routes/auth.js"; // ✅ ĐÚNG - Import auth routes
import userRoutes from "./routes/users.js";
import otpForgotRoutes from "./routes/otp/forgot.js";
import otpRegisterRoutes from "./routes/otp/register.js";
import friendsRoutes from "./routes/friend.js";

// ✨ NEW: Chat routes (REWRITE)
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

// Socket
import initSocket from "./socket/index.js";
import setupChatSocket from "./socket/chat.socket.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);
app.use(express.json());

connectDB();

// ✅ Public routes (không cần auth)
app.use("/api/auth", authRoutes);
app.use("/api/otp/forgot", otpForgotRoutes);
app.use("/api/otp/register", otpRegisterRoutes);

// ✅ Protected routes (cần auth)
app.use("/api/users", auth, userRoutes);
app.use("/api/friends", auth, friendsRoutes);
app.use("/api/conversations", auth, conversationRoutes);
app.use("/api/messages", auth, messageRoutes);

console.log("✅ All routes registered");

const PORT = process.env.PORT || 5000;
const server = createServer(app);

const io = initSocket(server);
setupChatSocket(io);

// Make io accessible
app.set("io", io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready`);
  console.log(`💬 Chat system ready`);
});