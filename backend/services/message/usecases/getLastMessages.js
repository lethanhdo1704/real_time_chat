// backend/services/message/usecases/getLastMessages.js
import mongoose from "mongoose";
import Message from "../../../models/Message.js";
import ConversationMember from "../../../models/ConversationMember.js";
import { isValidObjectId } from "../validators.js";
import { ValidationError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 GET LAST MESSAGES USE CASE (FOR SIDEBAR)
 * 
 * Business rules:
 * - Gets last message for each conversation
 * - Filters out admin-deleted messages
 * - Filters out user-hidden messages
 * - Returns with unread counts per conversation
 */
export async function getLastMessages(conversationIds, userId) {
  if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
    throw new ValidationError("conversationIds must be a non-empty array");
  }

  const validConversationIds = conversationIds
    .filter((id) => isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (validConversationIds.length === 0) return {};

  // Get member info with unreadCount
  const members = await ConversationMember.find({
    conversation: { $in: validConversationIds },
    user: userId,
    leftAt: null,
  })
    .select("conversation lastSeenMessage unreadCount")
    .lean();

  if (members.length === 0) return {};

  const memberMap = new Map(
    members.map((m) => [
      m.conversation.toString(),
      {
        lastSeenMessage: m.lastSeenMessage,
        unreadCount: m.unreadCount,
      },
    ])
  );

  const allowedConversationIds = members.map((m) => m.conversation);

  // ✅ Get last message for each conversation (filter hidden)
  const lastMessages = await Message.aggregate([
    {
      $match: {
        conversation: { $in: allowedConversationIds },
        deletedAt: null,
        hiddenFor: { $ne: userId }, // ✅ Exclude hidden messages
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversation",
        messageId: { $first: "$_id" },
        content: { $first: "$content" },
        type: { $first: "$type" },
        sender: { $first: "$sender" },
        replyTo: { $first: "$replyTo" },
        isRecalled: { $first: "$isRecalled" },
        recalledAt: { $first: "$recalledAt" },
        createdAt: { $first: "$createdAt" },
        editedAt: { $first: "$editedAt" },
      },
    },
  ]);

  const populated = await Message.populate(lastMessages, {
    path: "sender",
    select: "uid nickname avatar",
  });

  const result = {};

  populated.forEach((msg) => {
    const conversationId = msg._id.toString();
    const memberData = memberMap.get(conversationId);

    result[conversationId] = {
      messageId: msg.messageId,
      content: msg.content,
      type: msg.type,
      sender: msg.sender
        ? {
            uid: msg.sender.uid,
            nickname: msg.sender.nickname,
            avatar: msg.sender.avatar,
          }
        : null,
      isReply: !!msg.replyTo,
      isRecalled: msg.isRecalled || false,
      recalledAt: msg.recalledAt || null,
      createdAt: msg.createdAt,
      editedAt: msg.editedAt || null,
      unreadCount: memberData.unreadCount,
      lastSeenMessage: memberData.lastSeenMessage || null,
    };
  });

  return result;
}