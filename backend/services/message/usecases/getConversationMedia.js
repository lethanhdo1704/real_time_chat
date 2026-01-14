// backend/services/message/usecases/getConversationMedia.js
import mongoose from "mongoose";
import Message from "../../../models/Message.js";
import ConversationMember from "../../../models/ConversationMember.js";

/**
 * 🔥 GET CONVERSATION MEDIA - FIXED CURSOR PAGINATION
 * Optimized endpoint for fetching media items (images/videos/audios/files/links)
 * 
 * ✅ Only queries messages with attachments
 * ✅ Returns lightweight data structure
 * ✅ Cursor-based pagination (tracks message + attachment index)
 * ✅ Filters by mediaType
 * ✅ LIMITS BY ITEMS, NOT MESSAGES
 * ✅ FIXED: Properly handles multiple attachments per message
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (MongoDB _id)
 * @param {Object} options - { mediaType, before, limit }
 * @returns {Promise<Object>} { items, hasMore, oldestItemId }
 */
export const getConversationMedia = async (conversationId, userId, options = {}) => {
  try {
    const { mediaType, before = null, limit = 20 } = options;

    console.log('🎬 [getConversationMedia] Fetching media:', {
      conversationId,
      mediaType,
      before: before || 'none',
      limit,
    });

    // ============================================
    // 1. VERIFY MEMBERSHIP
    // ============================================

    const isMember = await ConversationMember.exists({
      conversation: conversationId,
      user: userId,
      leftAt: null,
    });

    if (!isMember) {
      throw new Error('Not a member of this conversation');
    }

    // ============================================
    // 2. PARSE CURSOR (if exists)
    // ============================================

    let beforeMessageId = null;
    let beforeAttachmentIndex = -1;

    if (before) {
      // Cursor format: "messageId_attachmentIndex"
      // e.g., "507f1f77bcf86cd799439011_2" means 3rd attachment of that message
      const parts = before.split('_');
      if (parts.length === 2 && mongoose.Types.ObjectId.isValid(parts[0])) {
        beforeMessageId = new mongoose.Types.ObjectId(parts[0]);
        beforeAttachmentIndex = parseInt(parts[1]) || 0;
      }
    }

    // ============================================
    // 3. BUILD QUERY
    // ============================================

    const query = {
      conversation: new mongoose.Types.ObjectId(conversationId),
      deletedAt: null,
      hiddenFor: { $ne: new mongoose.Types.ObjectId(userId) },
      // 🔥 Only fetch messages that have attachments with matching mediaType
      attachments: {
        $elemMatch: {
          mediaType: mediaType,
        },
      },
    };

    console.log('🔍 [getConversationMedia] Query:', {
      conversationId: query.conversation,
      mediaType,
      beforeMessageId: beforeMessageId?.toString() || 'none',
      beforeAttachmentIndex,
    });

    // ============================================
    // 4. FETCH MESSAGES
    // ============================================

    // Fetch enough messages to get the items we need
    // For small limits, fetch more to ensure we get enough items
    const fetchLimit = limit <= 10 ? 100 : 200;

    const messages = await Message.find(query)
      .sort({ _id: -1 }) // Newest first
      .limit(fetchLimit)
      .select('_id attachments createdAt')
      .lean();

    console.log('✅ [getConversationMedia] Fetched:', messages.length, 'messages');

    // ============================================
    // 5. FLATTEN TO ITEMS WITH CURSOR TRACKING
    // ============================================

    const allItems = [];
    let foundCursor = !before; // If no cursor, start from beginning

    for (const message of messages) {
      // 🔥 Get ALL attachments with their original indices, then REVERSE
      // Newest attachment (last in array) should appear first
      const attachmentsWithIndex = message.attachments
        .map((att, idx) => ({ att, originalIndex: idx }))
        .filter(({ att }) => att.mediaType === mediaType)
        .reverse(); // Newest attachment first

      for (let i = 0; i < attachmentsWithIndex.length; i++) {
        const { att: attachment, originalIndex } = attachmentsWithIndex[i];

        // 🔥 Check if we've passed the cursor
        if (!foundCursor) {
          // Check if this is the cursor item (using original index)
          if (
            message._id.toString() === beforeMessageId?.toString() &&
            originalIndex === beforeAttachmentIndex
          ) {
            foundCursor = true; // Found cursor, start collecting from next item
          }
          continue; // Skip items before cursor
        }

        // Collect item (use original index for stable ID)
        allItems.push({
          id: `${message._id}_${originalIndex}`, // Unique ID: messageId_originalAttachmentIndex
          messageId: message._id.toString(),
          url: attachment.url,
          thumbnailUrl: attachment.thumbnailUrl || attachment.url,
          name: attachment.name,
          size: attachment.size,
          mime: attachment.mime,
          type: attachment.mediaType,
          createdAt: message.createdAt,
        });

        // 🔥 Stop if we have enough items (limit + 1 for hasMore check)
        if (allItems.length >= limit + 1) {
          break;
        }
      }

      // Break outer loop if we have enough
      if (allItems.length >= limit + 1) {
        break;
      }
    }

    // ============================================
    // 6. PREPARE RESPONSE
    // ============================================

    const hasMore = allItems.length > limit;
    const itemsToReturn = hasMore ? allItems.slice(0, limit) : allItems;

    // The cursor for next page is the ID of the last returned item
    const oldestItemId = itemsToReturn.length > 0
      ? itemsToReturn[itemsToReturn.length - 1].id
      : null;

    console.log('✅ [getConversationMedia] Returning:', {
      requestedLimit: limit,
      itemsReturned: itemsToReturn.length,
      hasMore,
      oldestItemId,
    });

    // ============================================
    // 7. RETURN RESULT
    // ============================================

    return {
      items: itemsToReturn,
      hasMore,
      oldestItemId,
    };

  } catch (error) {
    console.error('❌ [getConversationMedia] Error:', error.message);
    throw error;
  }
};