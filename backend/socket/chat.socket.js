// backend/socket/chat.socket.js
import jwt from "jsonwebtoken";
import ConversationMember from "../models/ConversationMember.js";

export default function setupChatSocket(io) {
  // Authentication middleware
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
  
  io.on('connection', async (socket) => {
    console.log(`💬 User connected: ${socket.uid} (${socket.id})`);
    
    // Auto-join all user's conversations on connect
    try {
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
    } catch (error) {
      console.error('❌ Auto-join error:', error);
    }
    
    // Join a specific conversation
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        console.log(`📥 join_conversation: ${socket.uid} → ${conversationId}`);
        
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          console.log(`❌ User ${socket.uid} not a member of ${conversationId}`);
          socket.emit('error', { message: 'Not a member of this conversation' });
          return;
        }
        
        socket.join(conversationId);
        console.log(`✅ User ${socket.uid} manually joined conversation ${conversationId}`);
      } catch (error) {
        console.error('❌ join_conversation error:', error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Leave a conversation
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      console.log(`👋 User ${socket.uid} left conversation ${conversationId}`);
    });
    
    // Typing indicator
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        console.log(`⌨️ typing: ${socket.uid} in ${conversationId} - ${isTyping}`);
        
        // Broadcast to other users in the conversation
        socket.to(conversationId).emit('user_typing', {
          conversationId,
          user: { uid: socket.uid },
          isTyping: isTyping !== undefined ? isTyping : true
        });
      } catch (error) {
        console.error('❌ Typing error:', error);
      }
    });
    
    // Message read receipt
    socket.on('message_read', async (data) => {
      try {
        const { conversationId, lastSeenMessage } = data;
        
        console.log(`👁️ message_read: ${socket.uid} in ${conversationId}`);
        
        // Verify user is member
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
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
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.uid} (${socket.id})`);
    });
  });
  
  // ✅ IMPORTANT: Return io instance so controllers can use it
  return io;
}