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
 * ✅ FIXED: Proper message creation without session
 */
export async function createMessage({
  conversationId,
  senderId,
  content,
  clientMessageId,
  type = "text",
  replyTo = null,
  attachments = [],
  session = null,
}) {
  const sanitizedContent = sanitizeContent(content);

  // Check if clientMessageId already exists (prevent duplicates)
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
    clientMessageId,
    type,
    replyTo,
    attachments,
  };

  // ✅ FIX: Create message properly based on session
  let message;
  if (session) {
    // With session, must use array syntax
    const messages = await Message.create([messageData], { session });
    message = messages[0];
  } else {
    // Without session, create single document
    message = await Message.create(messageData);
  }

  // Validate message was created with _id
  if (!message._id) {
    console.error('❌ Message created without _id:', message);
    throw new Error('Message creation failed - no _id');
  }

  console.log('✅ Message created with _id:', message._id);

  // Populate sender data
  await message.populate("sender", "uid nickname avatar");

  // Populate replyTo with sender info
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
 * ✅ Includes clientMessageId for optimistic UI
 */
export function formatMessageResponse(message) {
  return {
    messageId: message._id.toString(), // 🔥 FIX: Convert ObjectId to string
    clientMessageId: message.clientMessageId || null,
    conversation: message.conversation.toString(), // 🔥 FIX: Convert to string
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
          messageId: message.replyTo._id.toString(), // 🔥 FIX: Convert to string
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