// ===== controllers/message.controller.js =====
import messageService from "../services/message.service.js";

class MessageController {
  async sendMessage(req, res) {
    try {
      const { conversationId, content, type, replyTo, attachments } = req.body;
      
      if (!conversationId || !content) {
        return res.status(400).json({ message: 'conversationId and content are required' });
      }
      
      const result = await messageService.sendMessage({
        conversationId,
        senderId: req.user.id,
        content,
        type,
        replyTo,
        attachments
      });
      
      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(conversationId).emit('message_received', result.message);
      }
      
      res.status(201).json(result.message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
  
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { before, limit = 50 } = req.query;
      
      const result = await messageService.getMessages(
        conversationId,
        req.user.id,
        before,
        parseInt(limit)
      );
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
  
  async markAsRead(req, res) {
    try {
      const { conversationId } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ message: 'conversationId is required' });
      }
      
      const result = await messageService.markAsRead(conversationId, req.user.id);
      
      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(conversationId).emit('message_read', { 
          userId: req.user.uid, 
          ...result 
        });
      }
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default new MessageController();