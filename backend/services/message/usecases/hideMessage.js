// backend/services/message/usecases/hideMessage.js
import Message from "../../../models/Message.js";
import { isValidObjectId } from "../validators.js";
import { ValidationError, NotFoundError, AppError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 KIỂU 1: HIDE MESSAGE USE CASE (Gỡ tin nhắn)
 * 
 * Business rules:
 * - Anyone can hide any message from their view
 * - Message only disappears for the current user
 * - No socket event needed (client-side only)
 * - Cannot hide admin-deleted messages (already invisible)
 * 
 * UI: "Tin nhắn đã được gỡ"
 */
export async function hideMessage(messageId, userId) {
  if (!isValidObjectId(messageId)) {
    throw new ValidationError("Invalid messageId");
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError("Message");
    }

    // ✅ Cannot hide admin-deleted message (already invisible)
    if (message.deletedAt) {
      throw new AppError("Message already deleted", 400, "MESSAGE_DELETED");
    }

    // Check if already hidden
    if (message.isHiddenFor(userId)) {
      throw new AppError("Message already hidden", 400, "ALREADY_HIDDEN");
    }

    // Use model static method
    await Message.hideForUser(messageId, userId);

    console.log("✅ [HideMessage] Message hidden for user:", {
      messageId,
      userId,
    });

    // ✅ No socket event needed (only affects this user's view)

    return {
      success: true,
      messageId: messageId.toString(),
    };
  } catch (error) {
    console.error("❌ [HideMessage] Error:", error);
    throw error;
  }
}