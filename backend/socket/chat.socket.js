// backend/socket/chat.socket.js (UPDATED)
import jwt from "jsonwebtoken";
import ConversationMember from "../models/ConversationMember.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";

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
      // JOIN USER ROOM (for direct user events)
      // ============================================
      socket.join(`user:${socket.uid}`);
      console.log(`  ↳ Joined user room: user:${socket.uid}`);
      
      // ============================================
      // AUTO-JOIN ALL USER'S CONVERSATIONS
      // ============================================
      const conversations = await ConversationMember.find({
        user: socket.userId,
        leftAt: null
      }).select('conversation');
      
      conversations.forEach(conv => {
        const roomId = conv.conversation.toString();
        socket.join(roomId);
        console.log(`  ↳ Joined room: ${roomId}`);
      });
      
      console.log(`✅ User ${socket.uid} auto-joined ${conversations.length} conversations`);
      
      // ============================================
      // BROADCAST ONLINE STATUS TO FRIENDS
      // ============================================
      await broadcastOnlineStatus(socket, io, true);
      
    } catch (error) {
      console.error('❌ Auto-join error:', error);
    }
    
    // ============================================
    // JOIN CONVERSATION (Manual)
    // ============================================
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        console.log(`📥 join_conversation: ${socket.uid} → ${conversationId}`);
        
        // ✅ Verify membership
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
        console.log(`✅ User ${socket.uid} manually joined conversation ${conversationId}`);
        
        // Emit success
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
    // LEAVE CONVERSATION
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
    // TYPING INDICATOR
    // ============================================
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        console.log(`⌨️  typing: ${socket.uid} in ${conversationId} - ${isTyping}`);
        
        // ✅ ADDED: Verify membership
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          console.log(`❌ User ${socket.uid} not a member, cannot emit typing`);
          socket.emit('error', { 
            code: 'NOT_MEMBER',
            message: 'Not a member of this conversation' 
          });
          return;
        }
        
        // Broadcast to other users in the conversation (not to sender)
        socket.to(conversationId).emit('user_typing', {
          conversationId,
          user: { uid: socket.uid },
          isTyping: isTyping !== undefined ? isTyping : true
        });
        
        console.log(`✅ Typing indicator broadcasted for ${conversationId}`);
        
      } catch (error) {
        console.error('❌ Typing error:', error);
        socket.emit('error', { 
          code: 'TYPING_ERROR',
          message: error.message 
        });
      }
    });
    
    // ============================================
    // MESSAGE READ RECEIPT
    // ============================================
    socket.on('message_read', async (data) => {
      try {
        const { conversationId, lastSeenMessage } = data;
        
        console.log(`👁️  message_read: ${socket.uid} in ${conversationId}`);
        
        // ✅ ADDED: Verify membership
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          console.log(`❌ User ${socket.uid} not a member, cannot mark as read`);
          return;
        }
        
        // Broadcast read receipt to other users in conversation
        socket.to(conversationId).emit('message_read', {
          conversationId,
          user: { uid: socket.uid },
          lastSeenMessage,
          readAt: new Date()
        });
        
        console.log(`✅ Read receipt sent for ${conversationId}`);
        
      } catch (error) {
        console.error('❌ Message read error:', error);
        socket.emit('error', { 
          code: 'READ_ERROR',
          message: error.message 
        });
      }
    });
    
    // ============================================
    // DISCONNECT HANDLER
    // ============================================
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.uid} (${socket.id})`);
      
      try {
        // ✅ Broadcast offline status to friends
        await broadcastOnlineStatus(socket, io, false);
      } catch (error) {
        console.error('❌ Disconnect broadcast error:', error);
      }
    });
  });
  
  // ✅ Return io instance so controllers can use it
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
    }).populate('user friend', 'uid');
    
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