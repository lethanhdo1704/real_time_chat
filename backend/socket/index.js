// backend/socket/index.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import setupChatSocket from "./chat.socket.js";
import setupFriendSocket from "./friend.socket.js";
import setupCallSocket from "./call.socket.js"; // ✅ THÊM
import socketEmitter from "../services/socketEmitter.service.js";
import User from "../models/User.js";

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
    allowEIO3: true,
  });

  io.engine.on("initial_headers", (headers, req) => {
    console.log('🔍 Socket handshake from:', req.headers.origin || 'no-origin');
  });

  // ✅ SOCKET AUTHENTICATION MIDDLEWARE
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();

      // ✅ JOIN USER ROOM
      socket.join(socket.userId);

      console.log(`✅ Socket authenticated: ${socket.id} -> User: ${user.username} (${socket.userId})`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`✅ Client connected: ${socket.id} (${socket.user.username})`);
    
    // ✅ SET USER ONLINE
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    socket.broadcast.emit('user:online', { userId: socket.userId });

    socket.on("disconnect", async (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} - ${reason}`);
      
      // ✅ SET USER OFFLINE
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      socket.broadcast.emit('user:offline', { userId: socket.userId });
    });
  });

  console.log('🔌 Socket.IO server initialized with authentication');

  socketEmitter.setIO(io);
  console.log('✅ [SocketEmitter] IO instance injected');

  setupChatSocket(io);
  console.log('💬 Chat socket handlers initialized');

  setupFriendSocket(io);
  console.log('👥 Friend socket handlers initialized');

  setupCallSocket(io); // ✅ THÊM
  console.log('📞 Call socket handlers initialized');

  return { io, socketEmitter };
}