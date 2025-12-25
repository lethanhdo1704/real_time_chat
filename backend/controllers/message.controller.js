// backend/controllers/message.controller.js
import messageService from "../services/message.service.js";

class MessageController {
  /**
   * Send message
   * POST /api/messages
   * 
   * ✅ CRITICAL: Do NOT emit socket here
   * Service already handles socket emission
   */
  async sendMessage(req, res, next) {
    try {
      const { conversationId, content, type, replyTo, attachments } = req.body;

      // Simple validation (detailed validation in middleware/service)
      if (!conversationId || !content) {
        return res.status(400).json({
          success: false,
          message: "conversationId and content are required"
        });
      }

      console.log('📤 [MessageController] Sending message:', {
        conversationId,
        senderId: req.user.id,
        contentLength: content.length,
      });

      // 🔥 Service handles EVERYTHING:
      // - Create message
      // - Update unreadCount
      // - Emit socket events
      const result = await messageService.sendMessage({
        conversationId,
        senderId: req.user.id,
        content,
        type,
        replyTo,
        attachments,
      });

      console.log('✅ [MessageController] Message sent:', result.message.messageId);

      // ✅ Just return the result - NO socket emission here
      res.status(201).json({
        success: true,
        data: result.message
      });
      
    } catch (error) {
      console.error("❌ [MessageController] sendMessage error:", error.message);
      next(error);
    }
  }

  /**
   * Get messages with pagination
   * GET /api/messages/:conversationId
   */
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { before, limit = 50 } = req.query;

      console.log('📥 [MessageController] Getting messages:', {
        conversationId,
        before: before || 'none',
        limit,
      });

      const result = await messageService.getMessages(
        conversationId,
        req.user.id,
        before,
        parseInt(limit, 10)
      );

      console.log('✅ [MessageController] Retrieved:', result.messages.length, 'messages');

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [MessageController] getMessages error:", error.message);
      next(error);
    }
  }

  /**
   * Mark conversation as read
   * POST /api/messages/read
   * 
   * ✅ Service handles socket emission
   */
  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.body;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: "conversationId is required"
        });
      }

      console.log('👁️  [MessageController] Marking as read:', {
        conversationId,
        userId: req.user.id,
      });

      // 🔥 Service handles socket emission
      const result = await messageService.markAsRead(
        conversationId,
        req.user.id
      );

      console.log('✅ [MessageController] Marked as read, unreadCount:', result.unreadCount);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("❌ [MessageController] markAsRead error:", error.message);
      next(error);
    }
  }

  /**
   * Get last messages for multiple conversations (sidebar)
   * POST /api/messages/last-messages
   */
  async getLastMessages(req, res, next) {
    try {
      const { conversationIds } = req.body;

      if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "conversationIds must be a non-empty array"
        });
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
      console.error("❌ [MessageController] getLastMessages error:", error.message);
      next(error);
    }
  }

  /**
   * Edit message
   * PUT /api/messages/:messageId
   * 
   * ✅ Service handles socket emission
   */
  async editMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "content is required"
        });
      }

      console.log('✏️  [MessageController] Editing message:', messageId);

      // 🔥 Service handles socket emission
      const result = await messageService.editMessage(
        messageId,
        req.user.id,
        content
      );

      console.log('✅ [MessageController] Message edited');

      res.json({
        success: true,
        data: result.message
      });
    } catch (error) {
      console.error("❌ [MessageController] editMessage error:", error.message);
      next(error);
    }
  }

  /**
   * Delete message (soft delete)
   * DELETE /api/messages/:messageId
   * 
   * ✅ Service handles socket emission
   */
  async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;

      console.log('🗑️  [MessageController] Deleting message:', messageId);

      // 🔥 Service handles socket emission
      const result = await messageService.deleteMessage(
        messageId,
        req.user.id
      );

      console.log('✅ [MessageController] Message deleted');

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error("❌ [MessageController] deleteMessage error:", error.message);
      next(error);
    }
  }
}

export default new MessageController();