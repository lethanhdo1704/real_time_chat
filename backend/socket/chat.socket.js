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
 * - message_recalled: Message recalled by sender
 * - message_deleted: Message deleted by admin
 * - user_typing: Typing indicator
 * - user_online: Friend came online
 * - user_offline: Friend went offline
 * - conversation_created: New conversation
 * - conversation_update: Unread count updates
 * - joined_conversation: Confirmation of room join
 * - left_conversation: Confirmation of room leave
 * - error: Error events
 * 
 * ============================================
 * ROOM NAMING CONVENTION (CRITICAL)
 * ============================================
 * 
 * 🟥 CONVERSATION EVENTS → conversation:{id}
 * - message_received, message_recalled, message_deleted, message_edited
 * - typing, conversation_updated, member_added, member_removed
 * 
 * 🟦 USER-SPECIFIC EVENTS → user:{uid}
 * - conversation_update (unread counts)
 * - user_online, user_offline
 * - conversation_created, conversation_joined, conversation_left
 * 
 * ============================================
 */

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
      // ============================================
      // 1️⃣ JOIN USER ROOM (for user-specific events)
      // ============================================
      const userRoom = getUserRoom(socket.uid);
      socket.join(userRoom);
      console.log(`  ↳ Joined user room: ${userRoom}`);
      
      // ============================================
      // 2️⃣ AUTO-JOIN ALL USER'S CONVERSATIONS
      // 🔥 FIXED: Use conversation:${id} format
      // ============================================
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
      
      // ============================================
      // 3️⃣ BROADCAST ONLINE STATUS
      // ============================================
      await broadcastOnlineStatus(socket, io, true);
      
    } catch (error) {
      console.error('❌ Socket connection setup error:', error);
    }
    
    // ============================================
    // EVENT: JOIN CONVERSATION (Manual)
    // 🔥 FIXED: Use conversation:${id} format
    // ============================================
    socket.on('join_conversation', async (data) => {
      try {
        console.log("🔥 [DEBUG] join_conversation RAW DATA:", data);
        
        const { conversationId } = data;
        
        if (!conversationId) {
          console.error("❌ [DEBUG] No conversationId in join_conversation data!");
          socket.emit('error', { 
            code: 'INVALID_DATA',
            message: 'conversationId is required' 
          });
          return;
        }
        
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
        
        // 🔥 CRITICAL FIX: Join with prefix
        const room = getConversationRoom(conversationId);
        socket.join(room);
        console.log(`✅ User ${socket.uid} joined room: ${room}`);
        
        // 🔥 VERIFY ROOM MEMBERSHIP
        const roomMembers = io.sockets.adapter.rooms.get(room);
        if (roomMembers) {
          console.log(`👥 Room ${room} now has ${roomMembers.size} members`);
        }
        
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
    // 🔥 FIXED: Use conversation:${id} format
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
    // EVENT: TYPING INDICATOR
    // 🔥 FIXED: Emit to conversation:${id} room
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
          return;
        }
        
        // 🔥 CRITICAL FIX: Emit to conversation room
        const room = getConversationRoom(conversationId);
        socket.to(room).emit('user_typing', {
          conversationId,
          user: { uid: socket.uid },
          isTyping: isTyping !== undefined ? isTyping : true
        });
        
        console.log(`✅ Typing indicator broadcasted to ${room}`);
        
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
    
    // Broadcast to friends using user rooms
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