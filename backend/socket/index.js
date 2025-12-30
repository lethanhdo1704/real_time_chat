// backend/socket/index.js
import { Server } from "socket.io";
import setupChatSocket from "./chat.socket.js";
import setupFriendSocket from "./friend.socket.js";
import socketEmitter from "../services/socketEmitter.service.js";

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true, // 🔥 Cho phép TẤT CẢ origins (development mode)
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
    allowEIO3: true,
  });

  // 🔥 Debug middleware - log mọi connection attempt
  io.engine.on("initial_headers", (headers, req) => {
    console.log('🔍 Socket handshake from:', req.headers.origin || 'no-origin');
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id} from ${socket.handshake.address}`);
    
    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} - ${reason}`);
    });
  });

  console.log('🔌 Socket.IO server initialized with CORS: ALL ORIGINS');

  socketEmitter.setIO(io);
  console.log('✅ [SocketEmitter] IO instance injected');

  setupChatSocket(io);
  console.log('💬 Chat socket handlers initialized');

  setupFriendSocket(io);
  console.log('👥 Friend socket handlers initialized');

  return { io, socketEmitter };
}