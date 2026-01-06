// backend/routes/reaction.routes.js
import express from "express";
import auth from "../middleware/auth.js";
import messageService from "../services/message/message.service.js";
import Message from "../models/Message.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * Toggle reaction (REST alternative)
 * POST /api/reactions/:messageId
 * 
 * Body: { emoji: "❤️" }
 */
router.post("/:messageId", async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "emoji is required",
        code: "EMOJI_REQUIRED"
      });
    }

    console.log(`🎭 [REST] Toggle reaction:`, {
      messageId,
      userId: req.user.id,
      emoji
    });

    const result = await messageService.toggleReaction(
      messageId,
      req.user.id,
      emoji
    );

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        reactions: result.reactions,
        conversationId: result.conversationId
      }
    });

  } catch (error) {
    console.error("❌ [REST] Toggle reaction error:", error.message);
    next(error);
  }
});

/**
 * Get reactions for a message
 * GET /api/reactions/:messageId
 */
router.get("/:messageId", async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const reactions = await Message.getReactions(messageId);

    res.json({
      success: true,
      data: {
        messageId,
        reactions
      }
    });

  } catch (error) {
    console.error("❌ [REST] Get reactions error:", error.message);
    next(error);
  }
});

export default router;