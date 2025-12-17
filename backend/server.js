import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { createServer } from "http";
import "dotenv/config";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import otpForgotRoutes from "./routes/otp/forgot.js";
import otpRegisterRoutes from "./routes/otp/register.js";
import friendsRoutes from "./routes/friend.js";

// Socket
import initSocket from "./socket/index.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/otp/forgot", otpForgotRoutes);
app.use("/api/otp/register", otpRegisterRoutes);
app.use("/api/friends", friendsRoutes);

console.log("✅ All routes registered");

// Start server
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Socket.IO ready`);
});
