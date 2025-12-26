// backend/services/message/conversation.helper.js
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";

/**
 * Update conversation's lastMessage
 */
export async function updateConversationLastMessage(conversationId, messageId, timestamp, session = null) {
  const conversation = session
    ? await Conversation.findById(conversationId).session(session)
    : await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  conversation.lastMessage = messageId;
  conversation.lastMessageAt = timestamp;

  await conversation.save({ session });

  return conversation;
}

/**
 * Get previous message after deletion
 */
export async function getPreviousMessage(conversationId, excludeMessageId, session = null) {
  const query = {
    conversation: conversationId,
    deletedAt: null,
    _id: { $ne: excludeMessageId },
  };

  return session
    ? await Message.findOne(query).sort({ _id: -1 }).session(session).lean()
    : await Message.findOne(query).sort({ _id: -1 }).lean();
}

/**
 * Update conversation after message deletion
 */
export async function updateConversationAfterDeletion(conversationId, deletedMessageId, session = null) {
  const conversation = session
    ? await Conversation.findById(conversationId).session(session)
    : await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Only update if deleted message was the last message
  if (conversation.lastMessage?.toString() !== deletedMessageId.toString()) {
    return null;
  }

  const prevMessage = await getPreviousMessage(conversationId, deletedMessageId, session);

  if (prevMessage) {
    conversation.lastMessage = prevMessage._id;
    conversation.lastMessageAt = prevMessage.createdAt;
  } else {
    conversation.lastMessage = null;
    conversation.lastMessageAt = null;
  }

  await conversation.save({ session });

  return prevMessage;
}