// ===== socket/chat.socket.js =====
import jwt from "jsonwebtoken";
import ConversationMember from "../models/ConversationMember.js";

export default function setupChatSocket(io) {
  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.uid = decoded.uid;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', async (socket) => {
    console.log(`💬 User connected: ${socket.uid}`);
    
    // Auto-join all user's conversations on connect
    try {
      const conversations = await ConversationMember.find({
        user: socket.userId,
        leftAt: null
      }).select('conversation');
      
      conversations.forEach(conv => {
        const roomId = conv.conversation.toString();
        socket.join(roomId);
      });
      
      console.log(`✅ User ${socket.uid} auto-joined ${conversations.length} conversations`);
    } catch (error) {
      console.error('Auto-join error:', error);
    }
    
    // Join a specific conversation
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        const isMember = await ConversationMember.isActiveMember(
          conversationId,
          socket.userId
        );
        
        if (!isMember) {
          socket.emit('error', { message: 'Not a member of this conversation' });
          return;
        }
        
        socket.join(conversationId);
        console.log(`User ${socket.uid} joined conversation ${conversationId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Leave a conversation
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      console.log(`User ${socket.uid} left conversation ${conversationId}`);
    });
    
    // Typing indicator with isTyping status
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        // Broadcast to other users in the conversation
        socket.to(conversationId).emit('user_typing', {
          conversationId,
          user: { uid: socket.uid },
          isTyping: isTyping !== undefined ? isTyping : true
        });
      } catch (error) {
        console.error('Typing error:', error);
      }
    });
    
    // Message read receipt
    socket.on('message_read', async (data) => {
      try {
        const { conversationId, lastSeenMessage } = data;
        
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
        
        console.log(`User ${socket.uid} read messages in ${conversationId}`);
      } catch (error) {
        console.error('Message read error:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.uid}`);
    });
  });
}