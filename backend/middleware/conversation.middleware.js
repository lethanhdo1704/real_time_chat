// middlewares/conversation.middleware.js
import ConversationMember from "../models/ConversationMember.js";

export const checkMembership = async (req, res, next) => {
  try {
    const { conversationId, id } = req.params;
    const targetConversationId = conversationId || id;

    if (!targetConversationId) {
      return res.status(400).json({ message: "Conversation ID required" });
    }

    const isMember = await ConversationMember.isActiveMember(
      targetConversationId,
      req.user.id
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Not a member of this conversation" });
    }

    req.conversationId = targetConversationId;
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error checking membership",
      error: error.message,
    });
  }
};
