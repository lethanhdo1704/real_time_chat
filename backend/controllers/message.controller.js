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

      const result = await messageService.sendMessage({
        conversationId,
        senderId: req.user.id, // Mongo _id
        content,
        type,
        replyTo,
        attachments,
      });

      // Emit socket event
      const io = req.app.get("io");
      if (io) {
        io.to(conversationId).emit("message_received", result.message);
      }

      res.status(201).json(result.message);
    } catch (error) {
      console.error("sendMessage error:", error);
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

      const result = await messageService.getMessages(
        conversationId,
        req.user.id,
        before,
        parseInt(limit, 10)
      );

      res.json(result);
    } catch (error) {
      console.error("getMessages error:", error);
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

      const result = await messageService.markAsRead(
        conversationId,
        req.user.id
      );

      // Emit socket event
      const io = req.app.get("io");
      if (io) {
        io.to(conversationId).emit("message_read", {
          userId: req.user.uid, // public uid
          ...result,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("markAsRead error:", error);
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

      const result = await messageService.getLastMessages(
        conversationIds,
        req.user.id
      );

      res.json(result);
    } catch (error) {
      console.error("getLastMessages error:", error);
      res.status(400).json({ message: error.message });
    }
  }
}

export default new MessageController();
