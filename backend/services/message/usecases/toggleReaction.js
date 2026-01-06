// backend/services/message/usecases/toggleReaction.js

import Message from "../../../models/Message.js";
import ConversationMember from "../../../models/ConversationMember.js";
import socketEmitter from "../../socketEmitter.service.js";

/**
 * ============================================
 * USE CASE: TOGGLE REACTION (FINAL VERSION)
 * ============================================
 * 
 * ✅ PRODUCTION READY:
 * - No emoji validation (trust FE emoji-picker-react)
 * - No per-user emoji limit
 * - Simple toggle logic
 * - Broadcast to entire room (including sender)
 * 
 * Business Rules:
 * 1. User must be conversation member
 * 2. Message must not be deleted/recalled
 * 3. Same user + emoji = toggle (add/remove)
 * 4. Broadcast single event to entire room
 * 
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID (MongoDB _id)
 * @param {string} emoji - Unicode emoji from emoji-picker-react
 * @returns {Promise<object>} { reactions, conversationId, messageId }
 */
export async function toggleReaction(messageId, userId, emoji) {
  console.log(`🎭 [toggleReaction] Start:`, {
    messageId,
    userId,
    emoji
  });

  // ============================================
  // 1️⃣ VALIDATE MESSAGE EXISTS
  // ============================================
  const message = await Message.findById(messageId)
    .select('conversation deletedAt isRecalled')
    .lean();

  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    error.code = 'MESSAGE_NOT_FOUND';
    throw error;
  }

  const conversationId = message.conversation.toString();

  // ============================================
  // 2️⃣ CHECK MESSAGE STATE
  // ============================================
  if (message.deletedAt) {
    const error = new Error('Cannot react to deleted message');
    error.statusCode = 400;
    error.code = 'MESSAGE_DELETED';
    throw error;
  }

  if (message.isRecalled) {
    const error = new Error('Cannot react to recalled message');
    error.statusCode = 400;
    error.code = 'MESSAGE_RECALLED';
    throw error;
  }

  // ============================================
  // 3️⃣ VERIFY MEMBERSHIP
  // ============================================
  const isMember = await ConversationMember.isActiveMember(
    conversationId,
    userId
  );

  if (!isMember) {
    const error = new Error('You are not a member of this conversation');
    error.statusCode = 403;
    error.code = 'NOT_MEMBER';
    throw error;
  }

  // ============================================
  // 4️⃣ TOGGLE REACTION (Atomic Operation)
  // ============================================
  const updatedMessage = await Message.toggleReaction(messageId, userId, emoji);

  console.log(`✅ [toggleReaction] Toggled, total reactions: ${updatedMessage.reactions.length}`);

  // ============================================
  // 5️⃣ BROADCAST TO ENTIRE ROOM
  // ✅ Single event for all users (including sender)
  // ============================================
  socketEmitter.emitReactionUpdate(
    conversationId, 
    messageId, 
    updatedMessage.reactions
  );

  console.log(`📡 [toggleReaction] Broadcasted to conversation: ${conversationId}`);

  // ============================================
  // 6️⃣ RETURN RESULT
  // ============================================
  return {
    reactions: updatedMessage.reactions,
    conversationId,
    messageId
  };
}