// backend/socket/index.js
import { Server } from "socket.io";
import setupChatSocket from "./chat.socket.js";
import setupFriendSocket from "./friend.socket.js";
import socketEmitter from "../services/socketEmitter.service.js";

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
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  console.log('🔌 Socket.IO server created');

  // ============================================
  // 2️⃣ INJECT IO INTO SOCKET EMITTER (SINGLETON)
  // ============================================
  socketEmitter.setIO(io);
  console.log('✅ [SocketEmitter] IO instance injected');

  // ============================================
  // 3️⃣ SETUP SOCKET HANDLERS
  // ============================================
  setupChatSocket(io);
  console.log('💬 Chat socket handlers initialized');

  setupFriendSocket(io);
  console.log('👥 Friend socket handlers initialized');

  // ============================================
  // 4️⃣ RETURN FOR SERVER.JS
  // ============================================
  return { io, socketEmitter };
}