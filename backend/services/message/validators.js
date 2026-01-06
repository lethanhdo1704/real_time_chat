// backend/services/message/validators.js
import mongoose from "mongoose";
import ConversationMember from "../../models/ConversationMember.js";
import Conversation from "../../models/Conversation.js";
import Friend from "../../models/Friend.js";
import Message from "../../models/Message.js";
import { ValidationError, AppError } from "../../middleware/errorHandler.js";

/**
 * Check if string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Verify user is active member of conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (MongoDB _id)
 * @param {object} session - MongoDB session (optional)
 * @returns {object} ConversationMember document
 * @throws {AppError} If user is not a member
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
    throw new AppError("Not a member of this conversation", 403, "NOT_MEMBER");
  }

  return member;
}

/**
 * Verify conversation exists and user can send message
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (MongoDB _id)
 * @param {object} session - MongoDB session (optional)
 * @returns {object} { conversation, member }
 * @throws {AppError} If conversation not found or user cannot access
 */
export async function verifyConversationAccess(conversationId, userId, session = null) {
  const conversation = session
    ? await Conversation.findById(conversationId).session(session)
    : await Conversation.findById(conversationId);

  if (!conversation) {
    throw new AppError("Conversation not found", 404, "CONVERSATION_NOT_FOUND");
  }

  // Verify membership
  const member = await verifyMembership(conversationId, userId, session);

  // For private chat, verify friendship
  if (conversation.type === "private") {
    const friendship = session
      ? await Friend.findById(conversation.friendshipId).session(session)
      : await Friend.findById(conversation.friendshipId);

    if (!friendship || friendship.status !== "accepted") {
      throw new AppError(
        "Cannot send message - not friends", 
        403, 
        "NOT_FRIENDS"
      );
    }
  }

  return { conversation, member };
}

/**
 * ✅ IMPROVED: Verify user can edit/delete message
 * 
 * @param {object} message - Message document
 * @param {string} userId - User ID (MongoDB _id)
 * @throws {AppError} If user is not the sender
 * 
 * Note: Does NOT check deletedAt or isRecalled - those should be checked 
 * separately in the use case for better error messages
 */
export function verifyMessageOwnership(message, userId) {
  if (message.sender.toString() !== userId.toString()) {
    throw new AppError(
      "Only message sender can edit this message", 
      403, 
      "NOT_SENDER"
    );
  }
  
  // ❌ REMOVED: deletedAt check - should be done in use case first
  // This keeps the validator focused on ownership only
}

/**
 * Verify message can be edited (within time limit)
 * 
 * @param {object} message - Message document
 * @param {number} maxMinutes - Maximum minutes allowed (default: 15)
 * @throws {AppError} If message is too old
 */
export function verifyEditTimeLimit(message, maxMinutes = 15) {
  const timeLimit = maxMinutes * 60 * 1000; // Convert to milliseconds
  const messageAge = Date.now() - message.createdAt.getTime();
  
  if (messageAge > timeLimit) {
    const minutesAgo = Math.floor(messageAge / 60000);
    throw new AppError(
      `Cannot edit message - time limit exceeded (sent ${minutesAgo} minutes ago)`, 
      403, 
      "EDIT_TIME_EXPIRED"
    );
  }
}

/**
 * ✅ Verify reply-to message exists and belongs to conversation
 * 
 * @param {string} replyToId - Message ID to reply to
 * @param {string} conversationId - Current conversation ID
 * @param {object} session - MongoDB session (optional)
 * @returns {object|null} Reply-to message or null if not provided
 * @throws {AppError} If replyTo message is invalid, not found, or deleted
 */
export async function verifyReplyToMessage(replyToId, conversationId, session = null) {
  // If no replyTo provided, skip validation
  if (!replyToId) {
    return null;
  }

  // Validate ObjectId format
  if (!isValidObjectId(replyToId)) {
    throw new ValidationError("Invalid replyTo messageId format");
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
    throw new AppError(
      "Reply-to message not found or has been deleted",
      404,
      "REPLY_MESSAGE_NOT_FOUND"
    );
  }

  // ✅ Additional security: Verify message belongs to the same conversation
  if (replyToMessage.conversation.toString() !== conversationId.toString()) {
    throw new AppError(
      "Reply-to message does not belong to this conversation",
      400,
      "REPLY_MESSAGE_MISMATCH"
    );
  }

  console.log("✅ [Validator] Reply-to message verified:", {
    replyToId,
    conversationId,
    messageContent: replyToMessage.content.substring(0, 50),
  });

  return replyToMessage;
}

/**
 * 🆕 Validate content length
 * 
 * @param {string} content - Message content
 * @param {number} maxLength - Maximum length (default: 5000)
 * @returns {string} Trimmed content
 * @throws {ValidationError} If content is invalid or exceeds max length
 */
export function validateContentLength(content, maxLength = 5000) {
  if (!content || typeof content !== 'string') {
    throw new ValidationError("Content must be a string");
  }

  const trimmed = content.trim();
  
  if (trimmed.length === 0) {
    throw new ValidationError("Content cannot be empty");
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `Content exceeds maximum length of ${maxLength} characters (got ${trimmed.length})`
    );
  }

  return trimmed;
}