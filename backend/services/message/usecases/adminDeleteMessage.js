// backend/services/message/usecases/adminDeleteMessage.js
import Message from "../../../models/Message.js";
import ConversationMember from "../../../models/ConversationMember.js";
import { isValidObjectId, verifyMessageOwnership } from "../validators.js";
import { updateConversationAfterDeletion } from "../conversation.helper.js";
import socketEmitter from "../../socketEmitter.service.js";
import { ValidationError, NotFoundError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 PRIORITY 1: ADMIN DELETE MESSAGE USE CASE (Highest priority)
 * 
 * Business rules:
 * - Only admin/owner can permanently delete
 * - Message disappears completely for everyone
 * - Clears all other states (hiddenFor, isRecalled)
 * - Updates conversation's lastMessage if needed
 * - Broadcasts socket event to all members
 * 
 * Note: Currently allows message owner to delete (implement admin check later)
 */
export async function adminDeleteMessage(messageId, adminId) {
  if (!isValidObjectId(messageId)) {
    throw new ValidationError("Invalid messageId");
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError("Message");
    }

    // ✅ Business rule: Check admin permission (implement in controller/middleware)
    // For now, allow message owner to delete
    verifyMessageOwnership(message, adminId);

    // Use model static method (clears all states)
    await Message.adminDelete(messageId, adminId);

    // Update conversation's lastMessage if needed
    const prevMessage = await updateConversationAfterDeletion(
      message.conversation,
      messageId,
      null
    );

    let memberUpdates = {};

    if (prevMessage !== null) {
      const members = await ConversationMember.find({
        conversation: message.conversation,
        leftAt: null,
      }).lean();

      members.forEach((member) => {
        memberUpdates[member.user.toString()] = {
          lastMessage: prevMessage
            ? {
                messageId: prevMessage._id,
                content: prevMessage.content,
                createdAt: prevMessage.createdAt,
              }
            : null,
          unreadCount: member.unreadCount,
        };
      });
    }

    // Emit socket event
    socketEmitter.emitMessageDeleted(
      message.conversation.toString(),
      messageId.toString(),
      adminId.toString(),
      memberUpdates
    );

    console.log("✅ [AdminDelete] Message deleted:", {
      messageId,
      adminId,
    });

    return {
      success: true,
      conversationId: message.conversation.toString(),
    };
  } catch (error) {
    console.error("❌ [AdminDelete] Error:", error);
    throw error;
  }
}