// backend/socket/index.js
import { Server } from "socket.io";
import setupChatSocket from "./chat.socket.js";
import SocketEmitter from "../services/socketEmitter.service.js";
import messageService from "../services/message.service.js";

/**
 * Initialize Socket.IO
 * 
 * This is the main entry point for all socket functionality
 * 
 * FLOW:
 * 1. Create Socket.IO server with CORS
 * 2. Setup chat socket handlers (auth, typing, etc)
 * 3. Create SocketEmitter service
 * 4. Inject SocketEmitter into messageService
 * 5. Return both io and socketEmitter for server.js
 */
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
  // 2️⃣ SETUP CHAT SOCKET HANDLERS
  // ============================================
  setupChatSocket(io);
  console.log('💬 Chat socket handlers initialized');

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

/**
 * ARCHITECTURE NOTES:
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │                    CLIENT REQUEST                        │
 * └─────────────────────────────────────────────────────────┘
 *                            │
 *                            ▼
 *                   ┌─────────────────┐
 *                   │  REST API       │
 *                   │  Controller     │
 *                   └────────┬────────┘
 *                            │
 *                            ▼
 *                   ┌─────────────────┐
 *                   │  Service        │ ◄─── Injects SocketEmitter
 *                   │  (Business)     │
 *                   └────────┬────────┘
 *                            │
 *                   ┌────────┴────────┐
 *                   │                 │
 *                   ▼                 ▼
 *            ┌──────────┐      ┌──────────────┐
 *            │    DB    │      │SocketEmitter │
 *            │  Update  │      │   Service    │
 *            └──────────┘      └──────┬───────┘
 *                                     │
 *                                     ▼
 *                              ┌─────────────┐
 *                              │  Socket.IO  │
 *                              │   Emit      │
 *                              └──────┬──────┘
 *                                     │
 *                                     ▼
 *                            ┌─────────────────┐
 *                            │  ALL CLIENTS    │
 *                            │  (Real-time)    │
 *                            └─────────────────┘
 * 
 * KEY PRINCIPLES:
 * - Socket.IO handlers (chat.socket.js) only handle:
 *   - Authentication
 *   - Room management
 *   - Typing indicators
 *   - Presence (online/offline)
 * 
 * - REST API + Service handle:
 *   - All data mutations (send, edit, delete)
 *   - Business logic
 *   - Socket emission via SocketEmitter
 * 
 * - SocketEmitter is the ONLY place that calls io.emit()
 *   (except for typing and presence in chat.socket.js)
 */