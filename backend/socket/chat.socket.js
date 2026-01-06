// backend/socket/chat.socket.js
import jwt from "jsonwebtoken";
import ConversationMember from "../models/ConversationMember.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import socketEmitter from "../services/socketEmitter.service.js";
import messageService from "../services/message/message.service.js";

/**
 * ============================================
 * RATE LIMIT STORE (In-memory)
 * Production: Use Redis
 * ============================================
 */
const rateLimitStore = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowStart = Math.floor(now / 10000); // 10-second windows
  const key = `${userId}:${windowStart}`;
  
  const count = rateLimitStore.get(key) || 0;
  
  if (count >= 10) {
    return false; // Rate limit exceeded
  }
  
  rateLimitStore.set(key, count + 1);
  
  // Cleanup old entries (every 100 requests)
  if (Math.random() < 0.01) {
    const cutoff = windowStart - 10;
    for (const [k] of rateLimitStore) {
      const [, timestamp] = k.split(':');
      if (parseInt(timestamp) < cutoff) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return true;
}

/**
 * 🔥 HELPER: Get standardized room names
 */
const getConversationRoom = (conversationId) => `conversation:${conversationId}`;
const getUserRoom = (uid) => `user:${uid}`;

export default function setupChatSocket(io) {
  // ============================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('❌ Socket connection rejected: no token');
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;   // MongoDB _id
      socket.uid = decoded.uid;     // Public uid
      
      console.log('✅ Socket authenticated:', socket.uid);
      next();
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      next(new Error('Authentication error'));
    }
  });
  
  // ============================================
  // CONNECTION HANDLER
  // ============================================
  io.on('connection', async (socket) => {
    console.log(`💬 User connected: ${socket.uid} (${socket.id})`);
    
    try {
      const userRoom = getUserRoom(socket.uid);
      socket.join(userRoom);
      console.log(`  ↳ Joined user room: ${userRoom}`);
      
      const conversations = await ConversationMember.find({
        user: socket.userId,
        leftAt: null
      }).select('conversation').lean();
      
      conversations.forEach(conv => {
        const conversationId = conv.conversation.toString();
        const room = getConversationRoom(conversationId);
        socket.join(room);
      });
      
      console.log(`✅ User ${socket.uid} auto-joined ${conversations.length} conversations`);
      
      await broadcastOnlineStatus(socket, io, true);
      
    } catch (error) {
      console.error('❌ Socket connection setup error:', error);
    }
    
    // ============================================
    // EVENT: JOIN CONVERSATION
    // ============================================
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        if (!conversationId) {
          socket.emit('error', { 
            code: 'INVALID_DATA',
            message: 'conversationId is required' 
          });
          return;
        }
        
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          socket.emit('error', { 
            code: 'NOT_MEMBER',
            message: 'Not a member of this conversation' 
          });
          return;
        }
        
        const room = getConversationRoom(conversationId);
        socket.join(room);
        console.log(`✅ User ${socket.uid} joined room: ${room}`);
        
        socket.emit('joined_conversation', { conversationId });
        
      } catch (error) {
        console.error('❌ join_conversation error:', error);
        socket.emit('error', { 
          code: 'JOIN_ERROR',
          message: error.message 
        });
      }
    });
    
    // ============================================
    // EVENT: LEAVE CONVERSATION
    // ============================================
    socket.on('leave_conversation', (data) => {
      try {
        const { conversationId } = data;
        const room = getConversationRoom(conversationId);
        socket.leave(room);
        console.log(`👋 User ${socket.uid} left room: ${room}`);
        
        socket.emit('left_conversation', { conversationId });
      } catch (error) {
        console.error('❌ leave_conversation error:', error);
      }
    });
    
    // ============================================
    // 🆕 EVENT: MESSAGE REACTION (FINAL VERSION)
    // ============================================
    socket.on('message:react', async (data) => {
      try {
        const { messageId, emoji } = data;
        const userId = socket.userId;
        
        console.log(`🎭 message:react:`, {
          user: socket.uid,
          messageId,
          emoji
        });
        
        // ============================================
        // VALIDATION: Only check required fields
        // ✅ NO emoji format validation (trust FE)
        // ============================================
        if (!messageId || !emoji) {
          socket.emit('error', { 
            type: 'INVALID_DATA',
            message: 'messageId and emoji are required',
            code: 'MISSING_FIELDS'
          });
          return;
        }
        
        // ============================================
        // RATE LIMITING
        // ============================================
        if (!checkRateLimit(userId)) {
          socket.emit('error', { 
            type: 'RATE_LIMIT',
            message: 'Too many reactions, please slow down',
            code: 'RATE_LIMIT_EXCEEDED'
          });
          return;
        }
        
        // ============================================
        // EXECUTE USE CASE
        // ============================================
        const result = await messageService.toggleReaction(
          messageId,
          userId,
          emoji
        );
        
        console.log(`✅ [message:react] Reaction toggled successfully`);
        
        // ============================================
        // ✅ BROADCAST TO ENTIRE ROOM (including sender)
        // No separate success event needed
        // ============================================
        // Socket emitter will handle broadcasting
        
      } catch (error) {
        console.error('❌ message:react error:', error);
        
        socket.emit('error', {
          type: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to process reaction',
          code: error.code || 'UNKNOWN_ERROR'
        });
      }
    });
    
    // ============================================
    // EVENT: MARK AS READ
    // ============================================
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, lastSeenMessageId } = data;
        
        if (!conversationId || !lastSeenMessageId) {
          socket.emit('error', { 
            code: 'INVALID_DATA',
            message: 'conversationId and lastSeenMessageId are required' 
          });
          return;
        }
        
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          socket.emit('error', { 
            code: 'NOT_MEMBER',
            message: 'Not a member of this conversation' 
          });
          return;
        }
        
        const message = await Message.findById(lastSeenMessageId)
          .select('conversation')
          .lean();
        
        if (!message) {
          socket.emit('error', { 
            code: 'MESSAGE_NOT_FOUND',
            message: 'Message not found' 
          });
          return;
        }
        
        if (message.conversation.toString() !== conversationId.toString()) {
          socket.emit('error', { 
            code: 'MESSAGE_MISMATCH',
            message: 'Message does not belong to this conversation' 
          });
          return;
        }
        
        const updatedMember = await ConversationMember.markAsRead(
          conversationId,
          socket.userId,
          lastSeenMessageId
        );
        
        if (!updatedMember) {
          socket.emit('error', { 
            code: 'UPDATE_FAILED',
            message: 'Failed to mark as read' 
          });
          return;
        }
        
        socketEmitter.emitReadReceipt(
          conversationId.toString(),
          socket.uid,
          lastSeenMessageId.toString()
        );
        
        socket.emit('mark_read_success', {
          conversationId,
          lastSeenMessageId,
          unreadCount: 0
        });
        
      } catch (error) {
        console.error('❌ mark_read error:', error);
        socket.emit('error', { 
          code: 'MARK_READ_ERROR',
          message: error.message 
        });
      }
    });
    
    // ============================================
    // EVENT: TYPING INDICATOR
    // ============================================
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          return;
        }
        
        const room = getConversationRoom(conversationId);
        socket.to(room).emit('user_typing', {
          conversationId,
          user: { uid: socket.uid },
          isTyping: isTyping !== undefined ? isTyping : true
        });
        
      } catch (error) {
        console.error('❌ Typing error:', error);
      }
    });
    
    // ============================================
    // DISCONNECT HANDLER
    // ============================================
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.uid} (${socket.id})`);
      
      try {
        await broadcastOnlineStatus(socket, io, false);
      } catch (error) {
        console.error('❌ Disconnect broadcast error:', error);
      }
    });
  });
  
  console.log('✅ Chat socket handlers initialized');
  return io;
}

// ============================================
// HELPER: BROADCAST ONLINE/OFFLINE STATUS
// ============================================
async function broadcastOnlineStatus(socket, io, isOnline) {
  try {
    const friendships = await Friend.find({
      $or: [
        { user: socket.userId, status: 'accepted' },
        { friend: socket.userId, status: 'accepted' }
      ]
    }).populate('user friend', 'uid').lean();
    
    const friendUids = friendships.map(f => {
      return f.user._id.toString() === socket.userId.toString() 
        ? f.friend.uid 
        : f.user.uid;
    });
    
    await User.findByIdAndUpdate(socket.userId, {
      lastSeen: new Date()
    });
    
    const eventName = isOnline ? 'user_online' : 'user_offline';
    friendUids.forEach(friendUid => {
      const userRoom = getUserRoom(friendUid);
      io.to(userRoom).emit(eventName, {
        uid: socket.uid,
        timestamp: new Date()
      });
    });
    
    console.log(
      `✅ Broadcasted ${eventName} for ${socket.uid} to ${friendUids.length} friends`
    );
    
  } catch (error) {
    console.error('❌ Broadcast online status error:', error);
  }
}