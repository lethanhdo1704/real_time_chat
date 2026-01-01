// backend/services/message/validators.js
import mongoose from "mongoose";
import ConversationMember from "../../models/ConversationMember.js";
import Conversation from "../../models/Conversation.js";
import Friend from "../../models/Friend.js";
import Message from "../../models/Message.js";

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Verify user is active member of conversation
 */
export async function verifyMembership(conversationId, userId, session = null) {
  const query = {
    conversation: conversationId,
    user: userId,
    leftAt: null,
  };

  const member = session
    ? await ConversationMember.findOne(query).session(session)
    : await ConversationMember.findOne(query);

  if (!member) {
    throw new Error("Not a member of this conversation");
  }

  return member;
}

/**
 * Verify conversation exists and user can send message
 */
export async function verifyConversationAccess(conversationId, userId, session = null) {
  const conversation = session
    ? await Conversation.findById(conversationId).session(session)
    : await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Verify membership
  const member = await verifyMembership(conversationId, userId, session);

  // For private chat, verify friendship
  if (conversation.type === "private") {
    const friendship = session
      ? await Friend.findById(conversation.friendshipId).session(session)
      : await Friend.findById(conversation.friendshipId);

    if (!friendship || friendship.status !== "accepted") {
      throw new Error("Cannot send message - not friends");
    }
  }

  return { conversation, member };
}

/**
 * Verify user can edit message
 */
export async function verifyMessageOwnership(message, userId) {
  if (message.sender.toString() !== userId.toString()) {
    throw new Error("Only message sender can edit/delete");
  }

  if (message.deletedAt) {
    throw new Error("Cannot modify deleted message");
  }
}

/**
 * Verify message can be edited (within time limit)
 */
export function verifyEditTimeLimit(message, maxMinutes = 15) {
  const timeLimit = maxMinutes * 60 * 1000;
  if (Date.now() - message.createdAt.getTime() > timeLimit) {
    throw new Error(`Cannot edit message older than ${maxMinutes} minutes`);
  }
}

/**
 * ✅ NEW: Verify reply-to message exists and belongs to conversation
 * 
 * @param {string} replyToId - Message ID to reply to
 * @param {string} conversationId - Current conversation ID
 * @param {object} session - MongoDB session (optional)
 * @returns {object|null} Reply-to message or null if not provided
 * @throws {Error} If replyTo message is invalid, not found, or deleted
 */
export async function verifyReplyToMessage(replyToId, conversationId, session = null) {
  // If no replyTo provided, skip validation
  if (!replyToId) {
    return null;
  }

  // Validate ObjectId format
  if (!isValidObjectId(replyToId)) {
    throw new Error("Invalid replyTo messageId format");
  }

  // Find message with session support
  const query = {
    _id: replyToId,
    conversation: conversationId,
    deletedAt: null, // ✅ Cannot reply to deleted messages
  };

  const replyToMessage = session
    ? await Message.findOne(query).session(session).lean()
    : await Message.findOne(query).lean();

  // Message must exist
  if (!replyToMessage) {
    throw new Error("Reply-to message not found or has been deleted");
  }

  // ✅ Additional security: Verify message belongs to the same conversation
  if (replyToMessage.conversation.toString() !== conversationId.toString()) {
    throw new Error("Reply-to message does not belong to this conversation");
  }

  console.log("✅ [Validator] Reply-to message verified:", {
    replyToId,
    conversationId,
    messageContent: replyToMessage.content.substring(0, 50),
  });

  return replyToMessage;
}