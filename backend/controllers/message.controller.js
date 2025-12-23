// backend/controllers/message.controller.js
import messageService from "../services/message.service.js";

class MessageController {
  // ======================
  // POST /api/messages
  // ======================
  async sendMessage(req, res) {
    try {
      const { conversationId, content, type, replyTo, attachments } = req.body;

      if (!conversationId || !content) {
        return res
          .status(400)
          .json({ message: "conversationId and content are required" });
      }

      console.log('📤 [MessageController] Sending message:', {
        conversationId,
        senderId: req.user.id,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      });

      const result = await messageService.sendMessage({
        conversationId,
        senderId: req.user.id, // Mongo _id
        content,
        type,
        replyTo,
        attachments,
      });

      console.log('✅ [MessageController] Message saved:', result.message.messageId);

      // ✅ FIX: Emit socket event to ALL users in room (including sender)
      const io = req.app.get("io");
      if (io) {
        console.log('📡 [MessageController] Emitting to room:', conversationId);
        
        // Emit to the room (all connected users)
        io.to(conversationId).emit("message_received", {
          message: result.message
        });
        
        console.log('✅ [MessageController] Socket event emitted');
      } else {
        console.warn('⚠️ [MessageController] Socket.io not available');
      }

      // Return message to sender
      res.status(201).json(result.message);
      
    } catch (error) {
      console.error("❌ [MessageController] sendMessage error:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // ======================
  // GET /api/messages/:conversationId
  // ======================
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { before, limit = 50 } = req.query;

      console.log('📥 [MessageController] Getting messages:', {
        conversationId,
        before,
        limit,
      });

      const result = await messageService.getMessages(
        conversationId,
        req.user.id,
        before,
        parseInt(limit, 10)
      );

      console.log('✅ [MessageController] Retrieved messages:', result.messages.length);

      res.json(result);
    } catch (error) {
      console.error("❌ [MessageController] getMessages error:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // ======================
  // POST /api/messages/read
  // ======================
  async markAsRead(req, res) {
    try {
      const { conversationId } = req.body;

      if (!conversationId) {
        return res
          .status(400)
          .json({ message: "conversationId is required" });
      }

      console.log('👁️ [MessageController] Marking as read:', {
        conversationId,
        userId: req.user.id,
      });

      const result = await messageService.markAsRead(
        conversationId,
        req.user.id
      );

      // Emit socket event to other users
      const io = req.app.get("io");
      if (io) {
        console.log('📡 [MessageController] Emitting read receipt to room:', conversationId);
        
        io.to(conversationId).emit("message_read", {
          conversationId,
          user: { uid: req.user.uid }, // public uid
          lastSeenMessage: result.lastSeenMessage,
          readAt: result.lastSeenAt,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("❌ [MessageController] markAsRead error:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // ======================
  // POST /api/messages/last-messages
  // ======================
  async getLastMessages(req, res) {
    try {
      const { conversationIds } = req.body;

      if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
        return res
          .status(400)
          .json({ message: "conversationIds must be a non-empty array" });
      }

      console.log('📥 [MessageController] Getting last messages for:', conversationIds.length, 'conversations');

      const result = await messageService.getLastMessages(
        conversationIds,
        req.user.id
      );

      res.json(result);
    } catch (error) {
      console.error("❌ [MessageController] getLastMessages error:", error);
      res.status(400).json({ message: error.message });
    }
  }
}

export default new MessageController();