// backend/services/message/message.creator.js
import sanitizeHtml from "sanitize-html";
import Message from "../../models/Message.js";

/**
 * Sanitize message content
 */
export function sanitizeContent(content) {
  if (typeof content !== "string") return content;
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Create message with sanitization
 * ✅ Now supports clientMessageId for optimistic UI
 */
export async function createMessage({
  conversationId,
  senderId,
  content,
  clientMessageId, // 🔥 NEW: From frontend
  type = "text",
  replyTo = null,
  attachments = [],
  session = null,
}) {
  const sanitizedContent = sanitizeContent(content);

  // 🔥 Check if clientMessageId already exists (prevent duplicates)
  if (clientMessageId) {
    const existing = await Message.findByClientId(clientMessageId);
    if (existing) {
      console.warn(`⚠️ Duplicate clientMessageId detected: ${clientMessageId}`);
      throw new Error("Message already exists");
    }
  }

  const messageData = {
    conversation: conversationId,
    sender: senderId,
    content: sanitizedContent,
    clientMessageId, // 🔥 Save client ID
    type,
    replyTo,
    attachments,
  };

  const messages = session
    ? await Message.create([messageData], { session })
    : await Message.create([messageData]);

  const message = messages[0];

  // Populate sender data
  await message.populate("sender", "uid nickname avatar");

  // 🔥 Populate replyTo with sender info
  if (message.replyTo) {
    await message.populate({
      path: "replyTo",
      select: "content sender createdAt",
      populate: {
        path: "sender",
        select: "uid nickname avatar",
      },
    });
  }

  return message;
}

/**
 * Format message for response
 * ✅ Now includes clientMessageId
 */
export function formatMessageResponse(message) {
  return {
    messageId: message._id,
    clientMessageId: message.clientMessageId || null, // 🔥 Include clientMessageId
    conversation: message.conversation,
    sender: message.sender
      ? {
          uid: message.sender.uid,
          nickname: message.sender.nickname,
          avatar: message.sender.avatar,
        }
      : null,
    content: message.content,
    type: message.type,
    replyTo: message.replyTo
      ? {
          messageId: message.replyTo._id,
          content: message.replyTo.content,
          sender: message.replyTo.sender
            ? {
                uid: message.replyTo.sender.uid,
                nickname: message.replyTo.sender.nickname,
              }
            : null,
          createdAt: message.replyTo.createdAt,
        }
      : null,
    attachments: message.attachments,
    createdAt: message.createdAt,
    editedAt: message.editedAt || null,
  };
}