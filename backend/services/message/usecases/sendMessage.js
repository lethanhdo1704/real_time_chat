// backend/services/message/usecases/sendMessage.js
import {
  isValidObjectId,
  verifyConversationAccess,
  verifyReplyToMessage,
} from "../validators.js";
import {
  createMessage,
  formatMessageResponse,
} from "../message.creator.js";
import {
  updateSenderRead,
  incrementUnreadForOthers,
  getMembersWithUnreadCounts,
} from "../unread.manager.js";
import {
  updateConversationLastMessage,
} from "../conversation.helper.js";
import socketEmitter from "../../socketEmitter.service.js";
import { ValidationError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 SEND MESSAGE USE CASE
 * 
 * Business rules:
 * - Must be a member of the conversation
 * - ReplyTo message must exist and be in same conversation
 * - Updates unread counts for other members
 * - Emits socket event to all members
 */
export async function sendMessage({
  conversationId,
  senderId,
  content,
  clientMessageId,
  type = "text",
  replyTo = null,
  attachments = [],
}) {
  if (!isValidObjectId(conversationId)) {
    throw new ValidationError("Invalid conversationId");
  }

  try {
    // 1️⃣ Verify access
    const { conversation, member } = await verifyConversationAccess(
      conversationId,
      senderId,
      null
    );

    // 1.5️⃣ Verify replyTo message if provided
    if (replyTo) {
      await verifyReplyToMessage(replyTo, conversationId, null);
      console.log("✅ [SendMessage] Reply-to message validated:", replyTo);
    }

    // 2️⃣ Create message
    const message = await createMessage({
      conversationId,
      senderId,
      content,
      clientMessageId,
      type,
      replyTo,
      attachments,
      session: null,
    });

    // 3️⃣ Update conversation's lastMessage
    await updateConversationLastMessage(
      conversationId,
      message._id,
      message.createdAt,
      null
    );

    // 4️⃣ Update sender's read status (unread = 0)
    await updateSenderRead(conversationId, senderId, message._id, null);

    // 5️⃣ Increment unread for others
    await incrementUnreadForOthers(conversationId, senderId, null);

    // 6️⃣ Format response
    const messageResponse = formatMessageResponse(message);

    // 7️⃣ Get all members with updated unread counts
    const memberUpdates = await getMembersWithUnreadCounts(conversationId);

    // 8️⃣ Emit socket event
    socketEmitter.emitNewMessage(
      conversationId.toString(),
      messageResponse,
      memberUpdates
    );

    console.log("✅ [SendMessage] Message sent:", {
      messageId: messageResponse.messageId,
      isReply: !!messageResponse.replyTo,
      replyToId: messageResponse.replyTo?.messageId,
    });

    return { message: messageResponse };
  } catch (error) {
    console.error("❌ [SendMessage] Error:", error);
    throw error;
  }
}