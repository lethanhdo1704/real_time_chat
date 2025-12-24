// backend/services/message.service.js
import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";
import Friend from "../models/Friend.js";

// =========================
// Helpers
// =========================
const sanitizeContent = (content) => {
  if (typeof content !== "string") return content;
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {}
  });
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

class MessageService {
  // =========================
  // SEND MESSAGE
  // =========================
  async sendMessage({ conversationId, senderId, content, type = "text", replyTo = null, attachments = [] }) {
    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const senderMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: senderId,
      leftAt: null
    });

    if (!senderMember) {
      throw new Error("Not a member of this conversation");
    }

    if (conversation.type === "private") {
      const friendship = await Friend.findById(conversation.friendshipId);
      if (!friendship || friendship.status !== "accepted") {
        throw new Error("Cannot send message - not friends");
      }
    }

    const sanitizedContent = sanitizeContent(content);

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: sanitizedContent,
      type,
      replyTo,
      attachments
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    senderMember.lastSeenMessage = message._id;
    senderMember.lastSeenAt = new Date();
    await senderMember.save();

    await message.populate("sender", "uid nickname avatar");

    return {
      message: {
        messageId: message._id,
        conversation: conversationId,
        sender: {
          uid: message.sender.uid,
          nickname: message.sender.nickname,
          avatar: message.sender.avatar
        },
        content: message.content,
        type: message.type,
        replyTo: message.replyTo,
        attachments: message.attachments,
        createdAt: message.createdAt,
        editedAt: message.editedAt || null
      }
    };
  }

  // =========================
  // GET MESSAGES (PAGINATION)
  // =========================
  async getMessages(conversationId, userId, before = null, limit = 50) {
    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    const isMember = await ConversationMember.isActiveMember(conversationId, userId);
    if (!isMember) {
      throw new Error("Not a member");
    }

    const query = {
      conversation: conversationId,
      deletedAt: null
    };

    if (before && isValidObjectId(before)) {
      query._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("sender", "uid nickname avatar")
      .populate("replyTo", "content sender");

    return {
      messages: messages.map(msg => ({
        messageId: msg._id,
        sender: msg.sender ? {
          uid: msg.sender.uid,
          nickname: msg.sender.nickname,
          avatar: msg.sender.avatar
        } : null,
        content: msg.content,
        type: msg.type,
        replyTo: msg.replyTo ? {
          messageId: msg.replyTo._id,
          content: msg.replyTo.content
        } : null,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
        editedAt: msg.editedAt || null
      })),
      hasMore: messages.length === limit
    };
  }

  // =========================
  // MARK AS READ
  // =========================
  async markAsRead(conversationId, userId) {
    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: userId,
      leftAt: null
    });

    if (!member) {
      throw new Error("Not a member");
    }

    const lastMessage = await Message.findOne({
      conversation: conversationId,
      deletedAt: null
    }).sort({ _id: -1 });

    if (!lastMessage) {
      return { success: true, lastSeenMessage: null };
    }

    member.lastSeenMessage = lastMessage._id;
    member.lastSeenAt = new Date();
    await member.save();

    return {
      success: true,
      lastSeenMessage: lastMessage._id,
      lastSeenAt: member.lastSeenAt
    };
  }

  // =========================
  // GET LAST MESSAGES (SIDEBAR)
  // =========================
  async getLastMessages(conversationIds, userId) {
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      throw new Error("conversationIds must be a non-empty array");
    }

    const validConversationIds = conversationIds
      .filter(id => isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (validConversationIds.length === 0) return {};

    const members = await ConversationMember.find({
      conversation: { $in: validConversationIds },
      user: userId,
      leftAt: null
    }).select("conversation");

    const allowedConversationIds = members.map(m => m.conversation);
    if (allowedConversationIds.length === 0) return {};

    const lastMessages = await Message.aggregate([
      { $match: { conversation: { $in: allowedConversationIds }, deletedAt: null } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversation",
          messageId: { $first: "$_id" },
          content: { $first: "$content" },
          type: { $first: "$type" },
          sender: { $first: "$sender" },
          createdAt: { $first: "$createdAt" },
          editedAt: { $first: "$editedAt" }
        }
      }
    ]);

    const populated = await Message.populate(lastMessages, {
      path: "sender",
      select: "uid nickname avatar"
    });

    const result = {};
    populated.forEach(msg => {
      result[msg._id.toString()] = {
        messageId: msg.messageId,
        content: msg.content,
        type: msg.type,
        sender: msg.sender ? {
          uid: msg.sender.uid,
          nickname: msg.sender.nickname,
          avatar: msg.sender.avatar
        } : null,
        createdAt: msg.createdAt,
        editedAt: msg.editedAt || null
      };
    });

    return result;
  }

  // =========================
  // EDIT MESSAGE
  // =========================
  async editMessage(messageId, userId, newContent) {
    if (!isValidObjectId(messageId)) {
      throw new Error("Invalid messageId");
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== userId.toString()) {
      throw new Error("Only message sender can edit");
    }

    if (message.deletedAt) {
      throw new Error("Cannot edit deleted message");
    }

    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > fifteenMinutes) {
      throw new Error("Cannot edit message older than 15 minutes");
    }

    message.content = sanitizeContent(newContent);
    message.editedAt = new Date();
    await message.save();

    await message.populate("sender", "uid nickname avatar");

    return {
      message: {
        messageId: message._id,
        conversation: message.conversation,
        sender: {
          uid: message.sender.uid,
          nickname: message.sender.nickname,
          avatar: message.sender.avatar
        },
        content: message.content,
        type: message.type,
        replyTo: message.replyTo,
        attachments: message.attachments,
        createdAt: message.createdAt,
        editedAt: message.editedAt
      }
    };
  }

  // =========================
  // DELETE MESSAGE (SOFT DELETE)
  // =========================
  async deleteMessage(messageId, userId) {
    if (!isValidObjectId(messageId)) {
      throw new Error("Invalid messageId");
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== userId.toString()) {
      throw new Error("Only message sender can delete");
    }

    if (message.deletedAt) {
      throw new Error("Message already deleted");
    }

    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    const conversation = await Conversation.findById(message.conversation);
    if (conversation?.lastMessage?.toString() === messageId.toString()) {
      const prevMessage = await Message.findOne({
        conversation: message.conversation,
        deletedAt: null,
        _id: { $ne: messageId }
      }).sort({ _id: -1 });

      if (prevMessage) {
        conversation.lastMessage = prevMessage._id;
        conversation.lastMessageAt = prevMessage.createdAt;
      } else {
        conversation.lastMessage = null;
        conversation.lastMessageAt = null;
      }

      await conversation.save();
    }

    return {
      success: true,
      conversationId: message.conversation.toString()
    };
  }
}

export default new MessageService();