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
        recipientId, // 🔥 For lazy conversation creation
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

      // If no conversationId, create conversation with recipientId
      if (!conversationId && recipientId) {
        console.log("🆕 [MessageController] Creating conversation with:", recipientId);

        try {
          // ✅ FIX: Use req.user.uid (not req.user.id)
          // Service expects uid string, not ObjectId
          const conversationData = await conversationService.createPrivate(
            req.user.uid,  // ✅ FIXED: uid string
            recipientId    // uid string
          );

          finalConversationId = conversationData.conversationId;

          console.log("✅ [MessageController] Conversation created:", finalConversationId);

          // Fetch conversation with members
          newConversation = await Conversation.findById(finalConversationId).lean();

          if (!newConversation) {
            throw new Error("Failed to fetch created conversation");
          }

          // Get conversation members with user info
          const members = await ConversationMember.find({
            conversation: finalConversationId,
            leftAt: null,
          })
            .populate("user", "uid nickname avatar fullName status")
            .lean();

          // Add members to conversation object
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
        senderId: req.user.id,  // ✅ Keep using id (ObjectId) for message sender
        contentLength: content.length,
      });

      // Service handles EVERYTHING:
      // - Create message
      // - Format response (returns messageId, not _id)
      // - Update unreadCount
      // - Emit socket events
      const result = await messageService.sendMessage({
        conversationId: finalConversationId,
        senderId: req.user.id,  // ✅ Keep using id for message operations
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
        req.user.id,  // ✅ Keep using id for message queries
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
        req.user.id  // ✅ Keep using id
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
        req.user.id  // ✅ Keep using id
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
        req.user.id,  // ✅ Keep using id
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
   * Delete message (soft delete)
   * DELETE /api/messages/:messageId
   */
  async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;

      console.log("🗑️  [MessageController] Deleting message:", messageId);

      const result = await messageService.deleteMessage(
        messageId, 
        req.user.id  // ✅ Keep using id
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