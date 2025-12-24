// backend/controllers/message.controller.js (UPDATED)
import messageService from "../services/message.service.js";
import { ValidationError, NotFoundError } from "../middleware/errorHandler.js";

class MessageController {
  // ======================
  // POST /api/messages
  // ======================
  async sendMessage(req, res, next) {
    try {
      const { conversationId, content, type, replyTo, attachments } = req.body;

      // Validation
      if (!conversationId || !content) {
        throw new ValidationError("conversationId and content are required");
      }

      console.log('📤 [MessageController] Sending message:', {
        conversationId,
        senderId: req.user.id,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      });

      // Send message via service
      const result = await messageService.sendMessage({
        conversationId,
        senderId: req.user.id,
        content,
        type,
        replyTo,
        attachments,
      });

      console.log('✅ [MessageController] Message saved:', result.message.messageId);

      // ✅ REFACTORED: Emit socket event via socketEmitter service
      const socketEmitter = req.app.get("socketEmitter");
      if (socketEmitter) {
        console.log('📡 [MessageController] Emitting via socketEmitter');
        socketEmitter.emitMessageReceived(conversationId, result.message);
        console.log('✅ [MessageController] Socket event emitted');
      } else {
        console.warn('⚠️  [MessageController] socketEmitter not available');
      }

      // Return message to sender
      res.status(201).json({
        success: true,
        data: result.message
      });
      
    } catch (error) {
      console.error("❌ [MessageController] sendMessage error:", error);
      next(error);
    }
  }

  // ======================
  // GET /api/messages/:conversationId
  // ======================
  async getMessages(req, res, next) {
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

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [MessageController] getMessages error:", error);
      next(error);
    }
  }

  // ======================
  // POST /api/messages/read
  // ======================
  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.body;

      if (!conversationId) {
        throw new ValidationError("conversationId is required");
      }

      console.log('👁️  [MessageController] Marking as read:', {
        conversationId,
        userId: req.user.id,
      });

      const result = await messageService.markAsRead(
        conversationId,
        req.user.id
      );

      // ✅ REFACTORED: Emit socket event via socketEmitter
      const socketEmitter = req.app.get("socketEmitter");
      if (socketEmitter) {
        console.log('📡 [MessageController] Emitting read receipt');
        socketEmitter.emitMessageRead(conversationId, {
          conversationId,
          user: { uid: req.user.uid },
          lastSeenMessage: result.lastSeenMessage,
          readAt: result.lastSeenAt,
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [MessageController] markAsRead error:", error);
      next(error);
    }
  }

  // ======================
  // POST /api/messages/last-messages
  // ======================
  async getLastMessages(req, res, next) {
    try {
      const { conversationIds } = req.body;

      if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
        throw new ValidationError("conversationIds must be a non-empty array");
      }

      console.log('📥 [MessageController] Getting last messages for:', conversationIds.length, 'conversations');

      const result = await messageService.getLastMessages(
        conversationIds,
        req.user.id
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [MessageController] getLastMessages error:", error);
      next(error);
    }
  }

  // ======================
  // PUT /api/messages/:messageId
  // NEW: Edit message
  // ======================
  async editMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;

      if (!content) {
        throw new ValidationError("content is required");
      }

      console.log('✏️  [MessageController] Editing message:', messageId);

      const result = await messageService.editMessage(
        messageId,
        req.user.id,
        content
      );

      // Emit socket event
      const socketEmitter = req.app.get("socketEmitter");
      if (socketEmitter) {
        socketEmitter.emitMessageEdited(
          result.message.conversation.toString(),
          result.message
        );
      }

      res.json({
        success: true,
        data: result.message
      });
    } catch (error) {
      console.error("❌ [MessageController] editMessage error:", error);
      next(error);
    }
  }

  // ======================
  // DELETE /api/messages/:messageId
  // NEW: Delete message (soft delete)
  // ======================
  async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;

      console.log('🗑️  [MessageController] Deleting message:', messageId);

      const result = await messageService.deleteMessage(
        messageId,
        req.user.id
      );

      // Emit socket event
      const socketEmitter = req.app.get("socketEmitter");
      if (socketEmitter) {
        socketEmitter.emitMessageDeleted(
          result.conversationId,
          messageId,
          req.user.uid
        );
      }

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error("❌ [MessageController] deleteMessage error:", error);
      next(error);
    }
  }
}

export default new MessageController();