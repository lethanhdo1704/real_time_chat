// backend/socket/index.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import setupChatSocket from "./chat.socket.js";
import setupFriendSocket from "./friend.socket.js";
import setupCallSocket from "./call.socket.js";
import socketEmitter from "../services/socketEmitter.service.js";
import User from "../models/User.js";
import setupGroupSocket from './group.socket.js';

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
  setupGroupSocket(io);

  io.engine.on("initial_headers", (headers, req) => {
    console.log('🔍 Socket handshake from:', req.headers.origin || 'no-origin');
  });

  // ============================================
  // ✅ SOCKET AUTHENTICATION MIDDLEWARE (FIXED)
  // ============================================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // 🔥 THÊM KIỂM TRA BAN NGAY TẠI ĐÂY
      const now = new Date();
      if (user.status === 'banned') {
        // Auto-unban nếu ban tạm hết hạn
        if (user.banEndAt && user.banEndAt < now) {
          await User.findByIdAndUpdate(user._id, {
            status: 'active',
            banStartAt: null,
            banEndAt: null,
            bannedBy: null,
            banReason: null
          });
        } else {
          // Vẫn bị ban → từ chối kết nối
          return next(new Error('BANNED'));
        }
      }

      // ============================================
      // 🎯 CHUẨN HÓA: uid cho realtime, _id cho DB
      // ============================================
      socket.user = user;
      socket.uid = user.uid;           // ✅ PUBLIC UID (cho socket rooms)
      socket.userId = user._id.toString(); // ✅ MONGO _ID (cho DB queries)

      // ============================================
      // ✅ JOIN ROOM = UID (KHÔNG PHẢI _id)
      // ============================================
      socket.join(user.uid);

      console.log(`✅ Socket authenticated: ${socket.id}`);
      console.log(`   ↳ UID: ${user.uid}`);
      console.log(`   ↳ User: ${user.nickname}`);
      console.log(`   ↳ Joined room: ${user.uid}`);
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ============================================
  // CONNECTION HANDLER
  // ============================================
  io.on("connection", async (socket) => {
    console.log(`✅ Client connected: ${socket.id} (${socket.user.nickname})`);
    
    // ✅ ĐĂNG KÝ SOCKET VỚI socketEmitter
    socketEmitter.registerUserSocket(socket.userId, socket.id);

    // ✅ SET USER ONLINE (dùng _id cho DB)
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    // ✅ BROADCAST ONLINE (dùng uid cho socket)
    socket.broadcast.emit('user:online', { uid: socket.uid });

    socket.on("disconnect", async (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} - ${reason}`);
      
      // ✅ HỦY ĐĂNG KÝ SOCKET
      socketEmitter.unregisterUserSocket(socket.userId, socket.id);

      // ✅ SET USER OFFLINE (dùng _id cho DB)
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      // ✅ BROADCAST OFFLINE (dùng uid cho socket)
      socket.broadcast.emit('user:offline', { uid: socket.uid });
    });
  });

  console.log('🔌 Socket.IO server initialized with UID-based rooms');

  socketEmitter.setIO(io);
  console.log('✅ [SocketEmitter] IO instance injected');

  setupChatSocket(io);
  console.log('💬 Chat socket handlers initialized');

  setupFriendSocket(io);
  console.log('👥 Friend socket handlers initialized');

  setupCallSocket(io);
  console.log('📞 Call socket handlers initialized (UID-based)');

  return { io, socketEmitter };
}