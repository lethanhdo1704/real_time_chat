// backend/services/message/usecases/editMessage.js
import Message from "../../../models/Message.js";
import {
  isValidObjectId,
  verifyMessageOwnership,
  verifyEditTimeLimit,
} from "../validators.js";
import { formatMessageResponse, sanitizeContent } from "../message.creator.js";
import socketEmitter from "../socket.emitter.js";
import { ValidationError, NotFoundError, AppError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 EDIT MESSAGE USE CASE
 * 
 * Business rules:
 * - Only sender can edit their message
 * - Must edit within 15 minutes
 * - Cannot edit recalled messages
 * - Emits socket event to all conversation members
 */
export async function editMessage(messageId, userId, newContent) {
  if (!isValidObjectId(messageId)) {
    throw new ValidationError("Invalid messageId");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new NotFoundError("Message");
  }

  verifyMessageOwnership(message, userId);
  verifyEditTimeLimit(message, 15);

  // ✅ Cannot edit recalled message
  if (message.isRecalled) {
    throw new AppError("Cannot edit recalled message", 400, "MESSAGE_RECALLED");
  }

  message.content = sanitizeContent(newContent);
  message.editedAt = new Date();
  await message.save();

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

  const messageResponse = formatMessageResponse(message);

  // Emit socket event
  socketEmitter.emitMessageEdited(
    message.conversation.toString(),
    messageResponse
  );

  return { message: messageResponse };
}