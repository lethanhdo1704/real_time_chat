// backend/services/message/usecases/editMessage.js
import Message from "../../../models/Message.js";
import {
  isValidObjectId,
  verifyMessageOwnership,
  verifyEditTimeLimit,
} from "../validators.js";
import { formatMessageResponse, sanitizeContent } from "../message.creator.js";
import socketEmitter from "../../socketEmitter.service.js";
import { ValidationError, NotFoundError, AppError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 EDIT MESSAGE USE CASE
 * 
 * Business rules:
 * 1. Only sender can edit their message
 * 2. Must edit within 15 minutes
 * 3. Cannot edit admin-deleted messages (deletedAt !== null)
 * 4. Cannot edit recalled messages (isRecalled === true)
 * 5. Content must be <= 5000 characters
 * 
 * @param {string} messageId - Message ID to edit
 * @param {string} userId - User ID (MongoDB _id)
 * @param {string} newContent - New message content
 * @returns {object} { message: formattedMessage, conversationId: string }
 */
export async function editMessage(messageId, userId, newContent) {
  // ============================================
  // 1️⃣ VALIDATE INPUT
  // ============================================
  
  if (!isValidObjectId(messageId)) {
    throw new ValidationError("Invalid messageId");
  }

  if (!newContent || typeof newContent !== 'string') {
    throw new ValidationError("Content is required");
  }

  // Trim and validate content length
  const trimmedContent = newContent.trim();
  
  if (trimmedContent.length === 0) {
    throw new ValidationError("Content cannot be empty");
  }

  if (trimmedContent.length > 5000) {
    throw new ValidationError("Content exceeds maximum length of 5000 characters");
  }

  // ============================================
  // 2️⃣ FETCH MESSAGE
  // ============================================
  
  const message = await Message.findById(messageId);
  
  if (!message) {
    throw new NotFoundError("Message");
  }

  // ============================================
  // 3️⃣ CHECK BUSINESS RULES (ORDER MATTERS)
  // ============================================

  // 🔴 PRIORITY 1: Cannot edit admin-deleted messages
  if (message.deletedAt) {
    throw new AppError(
      "Cannot edit deleted message", 
      403, 
      "MESSAGE_DELETED"
    );
  }

  // 🟡 PRIORITY 2: Cannot edit recalled messages
  if (message.isRecalled) {
    throw new AppError(
      "Cannot edit recalled message", 
      403, 
      "MESSAGE_RECALLED"
    );
  }

  // 🟢 PRIORITY 3: Verify ownership (only sender can edit)
  verifyMessageOwnership(message, userId);

  // ⏰ PRIORITY 4: Verify time limit (15 minutes)
  verifyEditTimeLimit(message, 15);

  // ============================================
  // 4️⃣ UPDATE MESSAGE
  // ============================================

  message.content = sanitizeContent(trimmedContent);
  message.editedAt = new Date();
  
  await message.save();

  console.log(`✅ [EditMessage] Message ${messageId} edited by user ${userId}`);

  // ============================================
  // 5️⃣ POPULATE RELATED DATA
  // ============================================

  await message.populate("sender", "uid nickname avatar");

  if (message.replyTo) {
    await message.populate({
      path: "replyTo",
      select: "content sender createdAt type isRecalled recalledAt",
      populate: {
        path: "sender",
        select: "uid nickname avatar",
      },
    });
  }

  // ============================================
  // 6️⃣ FORMAT RESPONSE
  // ============================================

  const messageResponse = formatMessageResponse(message);

  // ============================================
  // 7️⃣ EMIT SOCKET EVENT (REALTIME UPDATE)
  // ============================================

  try {
    socketEmitter.emitMessageEdited(
      message.conversation.toString(),
      messageResponse
    );
    
    console.log(`📡 [EditMessage] Socket event emitted to conversation:${message.conversation}`);
  } catch (socketError) {
    // Don't fail the request if socket fails
    console.error(`❌ [EditMessage] Socket emit failed:`, socketError.message);
  }

  // ============================================
  // 8️⃣ RETURN RESULT
  // ============================================

  return { 
    message: messageResponse,
    conversationId: message.conversation.toString() 
  };
}