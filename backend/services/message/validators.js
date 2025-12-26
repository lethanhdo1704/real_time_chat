// backend/services/message/validators.js
import mongoose from "mongoose";
import ConversationMember from "../../models/ConversationMember.js";
import Conversation from "../../models/Conversation.js";
import Friend from "../../models/Friend.js";

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