// backend/socket/index.js
import { Server } from "socket.io";
import setupChatSocket from "./chat.socket.js";
import setupFriendSocket from "./friend.socket.js"; // ✅ Import friend socket
import SocketEmitter from "../services/socketEmitter.service.js";
import messageService from "../services/message/message.service.js";

export default function initSocket(server) {
  // ============================================
  // 1️⃣ CREATE SOCKET.IO SERVER
  // ============================================
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    // Optional: Enable ping/pong for connection health
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  console.log('🔌 Socket.IO server created');

  // ============================================
  // 2️⃣ SETUP SOCKET HANDLERS
  // ============================================
  setupChatSocket(io);
  console.log('💬 Chat socket handlers initialized');

  setupFriendSocket(io); // ✅ Initialize friend socket handlers
  console.log('👥 Friend socket handlers initialized');

  // ============================================
  // 3️⃣ CREATE SOCKET EMITTER SERVICE
  // ============================================
  const socketEmitter = new SocketEmitter(io);
  console.log('📡 SocketEmitter service created');

  // ============================================
  // 4️⃣ INJECT SOCKET EMITTER INTO MESSAGE SERVICE
  // ============================================
  messageService.setSocketEmitter(socketEmitter);
  console.log('✅ SocketEmitter injected into messageService');

  // ============================================
  // 5️⃣ RETURN BOTH FOR SERVER.JS
  // ============================================
  return { io, socketEmitter };
}