// backend/services/message/usecases/deleteForMe.js
import Message from "../../../models/Message.js";
import { isValidObjectId, verifyMessageOwnership } from "../validators.js";
import { ValidationError, NotFoundError, AppError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 KIỂU 2: DELETE FOR ME USE CASE (Xóa tin nhắn của chính mình)
 * 
 * Business rules:
 * - Only sender can delete their own message from their view
 * - Message only disappears for the sender
 * - No socket event needed (client-side only)
 * - Cannot delete admin-deleted messages
 * - Cannot delete recalled messages
 * 
 * 🎯 KEY DIFFERENCE from KIỂU 1:
 * - KIỂU 1 (hideMessage): Anyone can hide any message
 * - KIỂU 2 (deleteForMe): Only sender can delete their own message
 * 
 * 📊 Data: Both use hiddenFor array (same as KIỂU 1)
 * 🎨 UI: "Bạn đã xóa tin nhắn này"
 */
export async function deleteForMe(messageId, userId) {
  if (!isValidObjectId(messageId)) {
    throw new ValidationError("Invalid messageId");
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError("Message");
    }

    // ✅ BUSINESS RULE: Only sender can delete their own message
    verifyMessageOwnership(message, userId);

    // ✅ Cannot delete admin-deleted message (already invisible)
    if (message.deletedAt) {
      throw new AppError("Message already deleted", 400, "MESSAGE_DELETED");
    }

    // ✅ Cannot delete recalled message (already shows placeholder)
    if (message.isRecalled) {
      throw new AppError("Cannot delete recalled message", 400, "MESSAGE_RECALLED");
    }

    // Check if already hidden
    if (message.isHiddenFor(userId)) {
      throw new AppError("Message already deleted for you", 400, "ALREADY_DELETED");
    }

    // Use model static method (same as KIỂU 1, but with ownership check)
    await Message.hideForUser(messageId, userId);

    console.log("✅ [DeleteForMe] Message deleted for sender:", {
      messageId,
      senderId: userId,
    });

    // ✅ No socket event needed (only affects sender's view)

    return {
      success: true,
      messageId: messageId.toString(),
      type: "delete_for_me", // ✅ For frontend to show different UI
    };
  } catch (error) {
    console.error("❌ [DeleteForMe] Error:", error);
    throw error;
  }
}