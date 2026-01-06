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
 * ✅ COMPLETE: Supports replyTo with proper population
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
    reactions: [], // ✅ Initialize empty reactions array
  };

  // Create message properly based on session
  let message;
  if (session) {
    const messages = await Message.create([messageData], { session });
    message = messages[0];
  } else {
    message = await Message.create(messageData);
  }

  // Validate message was created with _id
  if (!message._id) {
    console.error("❌ Message created without _id:", message);
    throw new Error("Message creation failed - no _id");
  }

  console.log("✅ Message created:", {
    messageId: message._id,
    hasReply: !!message.replyTo,
    clientMessageId: message.clientMessageId,
  });

  // Populate sender data
  await message.populate("sender", "uid nickname avatar");

  // ✅ Populate replyTo with full sender info + recall state
  if (message.replyTo) {
    await message.populate({
      path: "replyTo",
      select: "content sender createdAt type isRecalled recalledAt",
      populate: {
        path: "sender",
        select: "uid nickname avatar",
      },
    });

    console.log("✅ ReplyTo populated:", {
      replyToId: message.replyTo._id,
      replyToSender: message.replyTo.sender?.nickname,
      isRecalled: message.replyTo.isRecalled || false,
    });
  }

  // ✅ Populate reactions.user (for new messages)
  if (message.reactions && message.reactions.length > 0) {
    await message.populate({
      path: "reactions.user",
      select: "uid nickname avatar",
    });
  }

  return message;
}

/**
 * Format message for response
 * ✅ UPDATED: Include reactions with full user info
 */
export function formatMessageResponse(message) {
  const formatted = {
    messageId: message._id.toString(),
    clientMessageId: message.clientMessageId || null,
    conversation: message.conversation.toString(),
    sender: message.sender
      ? {
          uid: message.sender.uid,
          nickname: message.sender.nickname,
          avatar: message.sender.avatar,
        }
      : null,
    content: message.content,
    type: message.type,
    attachments: message.attachments,
    createdAt: message.createdAt,
    editedAt: message.editedAt || null,
    
    // ✅ Include message state for frontend
    isRecalled: message.isRecalled || false,
    recalledAt: message.recalledAt || null,

    // ✅ FIXED: Include reactions with user info
    reactions: message.reactions
      ? message.reactions.map((reaction) => ({
          user: reaction.user
            ? {
                _id: reaction.user._id?.toString() || reaction.user.toString(),
                uid: reaction.user.uid,
                nickname: reaction.user.nickname,
                avatar: reaction.user.avatar,
              }
            : null,
          emoji: reaction.emoji,
          createdAt: reaction.createdAt,
        }))
      : [],
  };

  // ✅ Format replyTo with recall state
  if (message.replyTo) {
    formatted.replyTo = {
      messageId: message.replyTo._id.toString(),
      content: message.replyTo.content,
      type: message.replyTo.type || "text",
      sender: message.replyTo.sender
        ? {
            uid: message.replyTo.sender.uid,
            nickname: message.replyTo.sender.nickname,
            avatar: message.replyTo.sender.avatar,
          }
        : null,
      createdAt: message.replyTo.createdAt,
      isRecalled: message.replyTo.isRecalled || false,
      recalledAt: message.replyTo.recalledAt || null,
    };
  } else {
    formatted.replyTo = null;
  }

  return formatted;
}