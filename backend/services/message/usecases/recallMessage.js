// backend/services/message/usecases/recallMessage.js
import Message from "../../../models/Message.js";
import { isValidObjectId, verifyMessageOwnership } from "../validators.js";
import socketEmitter from "../../socketEmitter.service.js";
import { ValidationError, NotFoundError, AppError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 KIỂU 3: RECALL MESSAGE USE CASE (Thu hồi)
 * 
 * Business rules:
 * - Only sender can recall their message
 * - ✅ NO TIME LIMIT (removed 15 minutes restriction)
 * - Cannot recall admin-deleted messages
 * - Cannot recall already-recalled messages
 * - Shows "Tin nhắn đã được thu hồi" to all users
 * - Broadcasts socket event to all conversation members
 * 
 * UI: "Tin nhắn đã được thu hồi" (visible to everyone)
 */
export async function recallMessage(messageId, userId) {
  if (!isValidObjectId(messageId)) {
    throw new ValidationError("Invalid messageId");
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError("Message");
    }

    // ✅ Business rule checks
    verifyMessageOwnership(message, userId);

    if (message.deletedAt) {
      throw new AppError("Cannot recall deleted message", 400, "MESSAGE_DELETED");
    }

    if (message.isRecalled) {
      throw new AppError("Message already recalled", 400, "ALREADY_RECALLED");
    }

    // ❌ REMOVED: Time limit check (15 minutes)
    // User can recall anytime now

    // Use model static method (clears hiddenFor by default)
    await Message.recallMessage(messageId, true);

    console.log("✅ [RecallMessage] Message recalled:", {
      messageId,
      senderId: userId,
    });

    // ✅ Emit socket event to all conversation members
    socketEmitter.emitMessageRecalled(
      message.conversation.toString(),
      messageId.toString(),
      userId.toString()
    );

    return {
      success: true,
      messageId: messageId.toString(),
    };
  } catch (error) {
    console.error("❌ [RecallMessage] Error:", error);
    throw error;
  }
}