// backend/controllers/message.controller.js
import messageService from "../services/message/message.service.js";
import conversationService from "../services/conversation/conversation.service.js";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";

class MessageController {
  async sendMessage(req, res, next) {
    try {
      const {
        conversationId,
        recipientId,
        content,
        clientMessageId,
        type,
        replyTo,
        attachments,
      } = req.body;

      // ============================================
      // VALIDATION
      // ============================================

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "content is required",
        });
      }

      if (!conversationId && !recipientId) {
        return res.status(400).json({
          success: false,
          message: "Either conversationId or recipientId is required",
        });
      }

      // ============================================
      // 🔥 LAZY CONVERSATION CREATION
      // ============================================

      let finalConversationId = conversationId;
      let newConversation = null;

      if (!conversationId && recipientId) {
        console.log("🆕 [MessageController] Creating conversation with:", recipientId);

        try {
          const conversationData = await conversationService.createPrivate(
            req.user.uid,
            recipientId
          );

          finalConversationId = conversationData.conversationId;

          console.log("✅ [MessageController] Conversation created:", finalConversationId);

          newConversation = await Conversation.findById(finalConversationId).lean();

          if (!newConversation) {
            throw new Error("Failed to fetch created conversation");
          }

          const members = await ConversationMember.find({
            conversation: finalConversationId,
            leftAt: null,
          })
            .populate("user", "uid nickname avatar fullName status")
            .lean();

          newConversation.participants = members.map((m) => ({
            user: m.user,
            role: m.role,
            joinedAt: m.joinedAt,
            unreadCount: m.unreadCount || 0,
          }));

          console.log("✅ [MessageController] Fetched conversation:", {
            id: newConversation._id,
            type: newConversation.type,
            participantsCount: newConversation.participants?.length,
          });

        } catch (convError) {
          console.error("❌ [MessageController] Failed to create conversation:", convError.message);
          return res.status(500).json({
            success: false,
            message: `Failed to create conversation: ${convError.message}`,
          });
        }
      }

      // ============================================
      // SEND MESSAGE
      // ============================================

      console.log("📤 [MessageController] Sending message:", {
        conversationId: finalConversationId,
        clientMessageId,
        senderId: req.user.id,
        contentLength: content.length,
      });

      const result = await messageService.sendMessage({
        conversationId: finalConversationId,
        senderId: req.user.id,
        content,
        clientMessageId,
        type,
        replyTo,
        attachments,
      });

      console.log("✅ [MessageController] Message sent:", {
        messageId: result.message.messageId,
        clientMessageId: result.message.clientMessageId,
      });

      // ============================================
      // RESPONSE
      // ============================================

      res.status(201).json({
        success: true,
        data: {
          message: result.message,
          conversation: newConversation,
        },
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

      console.log("📥 [MessageController] Getting messages:", {
        conversationId,
        before: before || "none",
        limit,
      });

      const result = await messageService.getMessages(
        conversationId,
        req.user.id,
        {
          before,
          limit: parseInt(limit),
        }
      );

      console.log(
        "✅ [MessageController] Retrieved:",
        result.messages.length,
        "messages"
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [MessageController] getMessages error:", error.message);
      next(error);
    }
  }

  /**
   * Mark conversation as read
   * POST /api/messages/read
   */
  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.body;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: "conversationId is required",
        });
      }

      console.log("👁️  [MessageController] Marking as read:", {
        conversationId,
        userId: req.user.id,
      });

      const result = await messageService.markAsRead(
        conversationId,
        req.user.id
      );

      console.log(
        "✅ [MessageController] Marked as read, unreadCount:",
        result.unreadCount
      );

      res.json({
        success: true,
        data: result,
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
          message: "conversationIds must be a non-empty array",
        });
      }

      console.log(
        "📥 [MessageController] Getting last messages for:",
        conversationIds.length,
        "conversations"
      );

      const result = await messageService.getLastMessages(
        conversationIds,
        req.user.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        "❌ [MessageController] getLastMessages error:",
        error.message
      );
      next(error);
    }
  }

  /**
   * Edit message
   * PUT /api/messages/:messageId
   */
  async editMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "content is required",
        });
      }

      console.log("✏️  [MessageController] Editing message:", messageId);

      const result = await messageService.editMessage(
        messageId,
        req.user.id,
        content
      );

      console.log("✅ [MessageController] Message edited");

      res.json({
        success: true,
        data: result.message,
      });
    } catch (error) {
      console.error("❌ [MessageController] editMessage error:", error.message);
      next(error);
    }
  }

  /**
   * 🆕 KIỂU 1: Hide message (Gỡ tin nhắn - bất kỳ message nào)
   * POST /api/messages/:messageId/hide
   * Business rule: Anyone can hide any message from their view
   */
  async hideMessage(req, res, next) {
    try {
      const { messageId } = req.params;

      console.log("👁️‍🗨️ [MessageController] Hiding message:", messageId);

      const result = await messageService.hideMessage(
        messageId,
        req.user.id
      );

      console.log("✅ [MessageController] Message hidden");

      res.json({
        success: true,
        message: "Message hidden successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ [MessageController] hideMessage error:", error.message);
      next(error);
    }
  }

  /**
   * 🆕 KIỂU 2: Delete for me (Xóa tin nhắn của chính mình - chỉ mình tôi thấy)
   * DELETE /api/messages/:messageId/delete-for-me
   * Business rule: Only sender can delete their own message from their view
   */
  async deleteForMe(req, res, next) {
    try {
      const { messageId } = req.params;

      console.log("🗑️  [MessageController] Delete for me:", messageId);

      const result = await messageService.deleteForMe(
        messageId,
        req.user.id
      );

      console.log("✅ [MessageController] Message deleted for user");

      res.json({
        success: true,
        message: "Message deleted for you successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ [MessageController] deleteForMe error:", error.message);
      next(error);
    }
  }

  /**
   * 🆕 KIỂU 3: Recall message (Thu hồi - mọi người thấy)
   * POST /api/messages/:messageId/recall
   */
  async recallMessage(req, res, next) {
    try {
      const { messageId } = req.params;

      console.log("↩️  [MessageController] Recalling message:", messageId);

      const result = await messageService.recallMessage(
        messageId,
        req.user.id
      );

      console.log("✅ [MessageController] Message recalled");

      res.json({
        success: true,
        message: "Message recalled successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ [MessageController] recallMessage error:", error.message);
      next(error);
    }
  }

  /**
   * 🔧 PRIORITY 1: Admin delete message (highest priority)
   * DELETE /api/messages/:messageId
   * Business rule: Only admin/owner can permanently delete
   */
  async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;

      console.log("🗑️  [MessageController] Admin deleting message:", messageId);

      const result = await messageService.adminDeleteMessage(
        messageId, 
        req.user.id
      );

      console.log("✅ [MessageController] Message deleted");

      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error(
        "❌ [MessageController] deleteMessage error:",
        error.message
      );
      next(error);
    }
  }
}

export default new MessageController();