// backend/services/message/usecases/getMessages.js
import Message from "../../../models/Message.js";
import ConversationMember from "../../../models/ConversationMember.js";
import { isValidObjectId } from "../validators.js";
import { formatMessageResponse } from "../message.creator.js";
import { ValidationError, AuthorizationError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 GET MESSAGES USE CASE - CURSOR-BASED PAGINATION
 * 
 * Business rules:
 * - Must be a member of the conversation
 * - Filters out admin-deleted messages (deletedAt != null)
 * - Filters out user-hidden messages (hiddenFor contains userId)
 * - Returns messages in chronological order (old → new)
 * - Includes hasMore flag for infinite scroll
 * - ✅ FIXED: Populates reactions.user for display
 */
export async function getMessages(conversationId, userId, options = {}) {
  const { before = null, limit = 50 } = options;

  if (!isValidObjectId(conversationId)) {
    throw new ValidationError("Invalid conversationId");
  }

  // Verify membership
  const isMember = await ConversationMember.isActiveMember(
    conversationId,
    userId
  );
  if (!isMember) {
    throw new AuthorizationError("Not a member of this conversation");
  }

  // ✅ Build query with visibility filters
  const query = {
    conversation: conversationId,
    deletedAt: null, // Exclude admin-deleted
    hiddenFor: { $ne: userId }, // Exclude hidden by this user
  };

  // Cursor-based: Get messages older than 'before'
  if (before && isValidObjectId(before)) {
    const beforeMessage = await Message.findById(before).lean();

    if (beforeMessage) {
      query.createdAt = { $lt: beforeMessage.createdAt };
    } else {
      console.warn("⚠️ [GetMessages] beforeMessage not found:", before);
    }
  }

  console.log("🔍 [GetMessages] Query:", {
    conversationId,
    userId,
    before: before || "none",
    limit,
    hasCreatedAtFilter: !!query.createdAt,
  });

  // ✅ FIXED: Added populate for reactions.user
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1)
    .populate("sender", "uid nickname avatar")
    .populate({
      path: "replyTo",
      select: "content sender createdAt type isRecalled recalledAt",
      populate: {
        path: "sender",
        select: "uid nickname avatar",
      },
    })
    .populate({
      path: "reactions.user",
      select: "uid nickname avatar",
    })
    .lean();

  // Check hasMore
  const hasMore = messages.length > parseInt(limit);
  const finalMessages = hasMore ? messages.slice(0, parseInt(limit)) : messages;

  console.log("✅ [GetMessages] Result:", {
    fetched: messages.length,
    returned: finalMessages.length,
    hasMore,
    repliesCount: finalMessages.filter((m) => m.replyTo).length,
    reactionsCount: finalMessages.reduce((sum, m) => sum + (m.reactions?.length || 0), 0),
  });

  // Reverse to return in chronological order (old → new)
  return {
    messages: finalMessages.reverse().map(formatMessageResponse),
    hasMore,
    oldestMessageId: finalMessages[0]?._id || null,
  };
}