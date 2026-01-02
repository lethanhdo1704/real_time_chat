// backend/socket/chat.socket.js
import jwt from "jsonwebtoken";
import ConversationMember from "../models/ConversationMember.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";

/**
 * ============================================
 * SOCKET EVENTS DOCUMENTATION
 * ============================================
 * 
 * CLIENT → SERVER (Incoming):
 * - join_conversation: Join a conversation room
 * - leave_conversation: Leave a conversation room
 * - typing: Broadcast typing indicator
 * 
 * SERVER → CLIENT (Outgoing):
 * - message_received: New message (sent via REST API + socket)
 * - message_edited: Message edited
 * - message_recalled: Message recalled by sender (🆕)
 * - message_deleted: Message deleted by admin
 * - user_typing: Typing indicator
 * - user_online: Friend came online
 * - user_offline: Friend went offline
 * - conversation_created: New conversation
 * - joined_conversation: Confirmation of room join
 * - left_conversation: Confirmation of room leave
 * - error: Error events
 * 
 * ============================================
 * MESSAGE DELETE TYPES (Priority Order):
 * ============================================
 * 
 * PRIORITY 1: message_deleted (Admin delete - highest)
 * - Sent by: Admin/Owner
 * - Effect: Message completely removed for everyone
 * - Event: "message_deleted"
 * - Data: { conversationId, messageId, deletedBy, conversationUpdate }
 * 
 * PRIORITY 2: message_recalled (Recall - sender only)
 * - Sent by: Message sender
 * - Effect: Shows "Message recalled" placeholder
 * - Event: "message_recalled" (🆕)
 * - Data: { conversationId, messageId, recalledBy, recalledAt }
 * - Time limit: 15 minutes
 * 
 * PRIORITY 3: Hide (User-specific delete)
 * - Sent by: Any user
 * - Effect: Hidden only for that user
 * - Event: None (local client-side only)
 * - No socket broadcast needed
 * 
 * ============================================
 */

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
      // ============================================
      // 1️⃣ JOIN USER ROOM (for per-user events)
      // ============================================
      socket.join(`user:${socket.uid}`);
      console.log(`  ↳ Joined user room: user:${socket.uid}`);
      
      // ============================================
      // 2️⃣ AUTO-JOIN ALL USER'S CONVERSATIONS
      // ============================================
      const conversations = await ConversationMember.find({
        user: socket.userId,
        leftAt: null
      }).select('conversation').lean();
      
      conversations.forEach(conv => {
        const roomId = conv.conversation.toString();
        socket.join(roomId);
      });
      
      console.log(`✅ User ${socket.uid} auto-joined ${conversations.length} conversations`);
      
      // ============================================
      // 3️⃣ BROADCAST ONLINE STATUS
      // ============================================
      await broadcastOnlineStatus(socket, io, true);
      
    } catch (error) {
      console.error('❌ Socket connection setup error:', error);
    }
    
    // ============================================
    // EVENT: JOIN CONVERSATION (Manual)
    // Used when user opens a conversation
    // ============================================
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        console.log(`📥 join_conversation: ${socket.uid} → ${conversationId}`);
        
        // Verify membership
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          console.log(`❌ User ${socket.uid} not a member of ${conversationId}`);
          socket.emit('error', { 
            code: 'NOT_MEMBER',
            message: 'Not a member of this conversation' 
          });
          return;
        }
        
        socket.join(conversationId);
        console.log(`✅ User ${socket.uid} joined conversation ${conversationId}`);
        
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
        socket.leave(conversationId);
        console.log(`👋 User ${socket.uid} left conversation ${conversationId}`);
        
        socket.emit('left_conversation', { conversationId });
      } catch (error) {
        console.error('❌ leave_conversation error:', error);
      }
    });
    
    // ============================================
    // EVENT: TYPING INDICATOR
    // This is the ONLY real-time action in socket
    // Messages are sent via REST API
    // ============================================
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        console.log(`⌨️  typing: ${socket.uid} in ${conversationId} - ${isTyping}`);
        
        // Verify membership
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          console.log(`❌ User ${socket.uid} not a member, cannot emit typing`);
          return; // Silent fail for typing - not critical
        }
        
        // Broadcast to other users in conversation
        socket.to(conversationId).emit('user_typing', {
          conversationId,
          user: { uid: socket.uid },
          isTyping: isTyping !== undefined ? isTyping : true
        });
        
        console.log(`✅ Typing indicator broadcasted for ${conversationId}`);
        
      } catch (error) {
        console.error('❌ Typing error:', error);
        // Silent fail - typing is not critical
      }
    });
    
    // ============================================
    // DISCONNECT HANDLER
    // ============================================
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.uid} (${socket.id})`);
      
      try {
        // Broadcast offline status
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
    // Get all accepted friends
    const friendships = await Friend.find({
      $or: [
        { user: socket.userId, status: 'accepted' },
        { friend: socket.userId, status: 'accepted' }
      ]
    }).populate('user friend', 'uid').lean();
    
    // Extract friend UIDs
    const friendUids = friendships.map(f => {
      return f.user._id.toString() === socket.userId.toString() 
        ? f.friend.uid 
        : f.user.uid;
    });
    
    // Update user's lastSeen
    await User.findByIdAndUpdate(socket.userId, {
      lastSeen: new Date()
    });
    
    // Broadcast to friends
    const eventName = isOnline ? 'user_online' : 'user_offline';
    friendUids.forEach(friendUid => {
      io.to(`user:${friendUid}`).emit(eventName, {
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