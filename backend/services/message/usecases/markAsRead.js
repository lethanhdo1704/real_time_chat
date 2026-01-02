// backend/services/message/usecases/markAsRead.js
import Message from "../../../models/Message.js";
import ConversationMember from "../../../models/ConversationMember.js";
import { isValidObjectId, verifyMembership } from "../validators.js";
import { resetUnreadCount } from "../unread.manager.js";
import socketEmitter from "../socket.emitter.js";
import { ValidationError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 MARK AS READ USE CASE
 * 
 * Business rules:
 * - Must be a member of the conversation
 * - Resets unread count to 0
 * - Updates lastSeenMessage to latest message
 * - Emits socket event to other members
 */
export async function markAsRead(conversationId, userId) {
  if (!isValidObjectId(conversationId)) {
    throw new ValidationError("Invalid conversationId");
  }

  const member = await verifyMembership(conversationId, userId);

  const lastMessage = await Message.findOne({
    conversation: conversationId,
    deletedAt: null,
  })
    .sort({ _id: -1 })
    .lean();

  if (!lastMessage) {
    return { success: true, lastSeenMessage: null };
  }

  // Reset unread count to 0
  await resetUnreadCount(conversationId, userId, lastMessage._id);

  // Get all member IDs for socket emission
  const allMembers = await ConversationMember.find({
    conversation: conversationId,
    leftAt: null,
  }).lean();

  const memberIds = allMembers.map((m) => m.user.toString());

  // Emit socket event
  socketEmitter.emitMessageRead(
    conversationId.toString(),
    userId.toString(),
    memberIds
  );

  return {
    success: true,
    lastSeenMessage: lastMessage._id,
    unreadCount: 0,
  };
}