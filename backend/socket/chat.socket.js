// ===== socket/chat.socket.js =====
import jwt from "jsonwebtoken";
import ConversationMember from "../models/ConversationMember.js";

export default function setupChatSocket(io) {
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
  
  io.on('connection', (socket) => {
    console.log(`💬 User connected: ${socket.uid}`);
    
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
    
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(conversationId);
    });
    
    socket.on('typing', async (data) => {
      try {
        const { conversationId } = data;
        socket.to(conversationId).emit('user_typing', {
          conversationId,
          user: { uid: socket.uid }
        });
      } catch (error) {
        console.error('Typing error:', error);
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`💬 User disconnected: ${socket.uid}`);
    });
  });
}