// backend/services/message/message.service.js
import mongoose from "mongoose";
import Message from "../../models/Message.js";
import ConversationMember from "../../models/ConversationMember.js";

// Import helpers
import {
  isValidObjectId,
  verifyMembership,
  verifyConversationAccess,
  verifyMessageOwnership,
  verifyEditTimeLimit,
  verifyReplyToMessage, // ✅ NEW
} from "./validators.js";
import {
  createMessage,
  formatMessageResponse,
  sanitizeContent,
} from "./message.creator.js";
import {
  updateSenderRead,
  incrementUnreadForOthers,
  resetUnreadCount,
  getMembersWithUnreadCounts,
} from "./unread.manager.js";
import {
  updateConversationLastMessage,
  updateConversationAfterDeletion,
} from "./conversation.helper.js";
import socketEmitter from "../socketEmitter.service.js";

class MessageService {
  /**
   * 🔥 SEND MESSAGE (CORE FUNCTION)
   * ✅ UPDATED: Added replyTo validation
   */
  async sendMessage({
    conversationId,
    senderId,
    content,
    clientMessageId,
    type = "text",
    replyTo = null,
    attachments = [],
  }) {
    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    try {
      // 1️⃣ Verify access
      const { conversation, member } = await verifyConversationAccess(
        conversationId,
        senderId,
        null
      );

      // ✅ 1.5️⃣ NEW: Verify replyTo message if provided
      if (replyTo) {
        await verifyReplyToMessage(replyTo, conversationId, null);
        console.log("✅ [MessageService] Reply-to message validated:", replyTo);
      }

      // 2️⃣ Create message
      const message = await createMessage({
        conversationId,
        senderId,
        content,
        clientMessageId,
        type,
        replyTo, // ✅ Pass validated replyTo
        attachments,
        session: null,
      });

      // 3️⃣ Update conversation's lastMessage
      await updateConversationLastMessage(
        conversationId,
        message._id,
        message.createdAt,
        null
      );

      // 4️⃣ Update sender's read status (unread = 0)
      await updateSenderRead(conversationId, senderId, message._id, null);

      // 5️⃣ Increment unread for others
      await incrementUnreadForOthers(conversationId, senderId, null);

      // 6️⃣ Format response
      const messageResponse = formatMessageResponse(message);

      // 7️⃣ Get all members with updated unread counts
      const memberUpdates = await getMembersWithUnreadCounts(conversationId);

      // 8️⃣ Emit socket event
      socketEmitter.emitNewMessage(
        conversationId.toString(),
        messageResponse,
        memberUpdates
      );

      console.log("✅ [MessageService] Message sent:", {
        messageId: messageResponse.messageId,
        isReply: !!messageResponse.replyTo,
        replyToId: messageResponse.replyTo?.messageId,
      });

      return { message: messageResponse };
    } catch (error) {
      console.error("❌ [MessageService] sendMessage error:", error);
      throw error;
    }
  }

  /**
   * 🔥 GET MESSAGES - CURSOR-BASED PAGINATION
   * ✅ UPDATED: Enhanced replyTo population
   */
  async getMessages(conversationId, userId, options = {}) {
    const { before = null, limit = 50 } = options;

    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    // Verify membership
    const isMember = await ConversationMember.isActiveMember(
      conversationId,
      userId
    );
    if (!isMember) {
      throw new Error("Not a member");
    }

    // Build query
    const query = {
      conversation: conversationId,
      deletedAt: null,
    };

    // Cursor-based: Get messages older than 'before'
    if (before && isValidObjectId(before)) {
      const beforeMessage = await Message.findById(before).lean();

      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      } else {
        console.warn("⚠️ [MessageService] beforeMessage not found:", before);
      }
    }

    console.log("🔍 [MessageService] Query:", {
      conversationId,
      before: before || "none",
      limit,
      hasCreatedAtFilter: !!query.createdAt,
    });

    // Fetch limit + 1 to check hasMore
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1)
      .populate("sender", "uid nickname avatar")
      .populate({
        path: "replyTo",
        select: "content sender createdAt type", // ✅ Include type
        populate: {
          path: "sender",
          select: "uid nickname avatar", // ✅ Full sender info
        },
      })
      .lean();

    // Check hasMore
    const hasMore = messages.length > parseInt(limit);
    const finalMessages = hasMore ? messages.slice(0, parseInt(limit)) : messages;

    console.log("✅ [MessageService] Result:", {
      fetched: messages.length,
      returned: finalMessages.length,
      hasMore,
      repliesCount: finalMessages.filter((m) => m.replyTo).length,
    });

    // Reverse to return in chronological order (old → new)
    return {
      messages: finalMessages.reverse().map(formatMessageResponse),
      hasMore,
      oldestMessageId: finalMessages[0]?._id || null,
    };
  }

  /**
   * 🔥 MARK AS READ
   */
  async markAsRead(conversationId, userId) {
    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    const member = await verifyMembership(conversationId, userId);

    const lastMessage = await Message.findOne({
      conversation: conversationId,
      deletedAt: null,
    })
      .sort({ _id: -1 })
      .lean();

    if (!lastMessage) {
      return { success: true, lastSeenMessage: null };
    }

    // Reset unread count to 0
    await resetUnreadCount(conversationId, userId, lastMessage._id);

    // Get all member IDs for socket emission
    const allMembers = await ConversationMember.find({
      conversation: conversationId,
      leftAt: null,
    }).lean();

    const memberIds = allMembers.map((m) => m.user.toString());

    // Emit socket event
    socketEmitter.emitMessageRead(
      conversationId.toString(),
      userId.toString(),
      memberIds
    );

    return {
      success: true,
      lastSeenMessage: lastMessage._id,
      unreadCount: 0,
    };
  }

  /**
   * Get last messages for sidebar
   * ✅ UPDATED: Include reply indicator
   */
  async getLastMessages(conversationIds, userId) {
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      throw new Error("conversationIds must be a non-empty array");
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

    // Get last message for each conversation
    const lastMessages = await Message.aggregate([
      {
        $match: {
          conversation: { $in: allowedConversationIds },
          deletedAt: null,
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
          replyTo: { $first: "$replyTo" }, // ✅ Include reply indicator
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
        isReply: !!msg.replyTo, // ✅ Flag for frontend to show reply icon
        createdAt: msg.createdAt,
        editedAt: msg.editedAt || null,
        unreadCount: memberData.unreadCount,
        lastSeenMessage: memberData.lastSeenMessage || null,
      };
    });

    return result;
  }

  /**
   * Edit message
   */
  async editMessage(messageId, userId, newContent) {
    if (!isValidObjectId(messageId)) {
      throw new Error("Invalid messageId");
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    verifyMessageOwnership(message, userId);
    verifyEditTimeLimit(message, 15);

    message.content = sanitizeContent(newContent);
    message.editedAt = new Date();
    await message.save();

    await message.populate("sender", "uid nickname avatar");

    // ✅ Populate replyTo if exists
    if (message.replyTo) {
      await message.populate({
        path: "replyTo",
        select: "content sender createdAt type",
        populate: {
          path: "sender",
          select: "uid nickname avatar",
        },
      });
    }

    const messageResponse = formatMessageResponse(message);

    // Emit socket event
    socketEmitter.emitMessageEdited(
      message.conversation.toString(),
      messageResponse
    );

    return { message: messageResponse };
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId, userId) {
    if (!isValidObjectId(messageId)) {
      throw new Error("Invalid messageId");
    }

    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      verifyMessageOwnership(message, userId);

      // Soft delete
      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save();

      // Update conversation's lastMessage if needed
      const prevMessage = await updateConversationAfterDeletion(
        message.conversation,
        messageId,
        null
      );

      let memberUpdates = {};

      if (prevMessage !== null) {
        // Get updated state for all members
        const members = await ConversationMember.find({
          conversation: message.conversation,
          leftAt: null,
        }).lean();

        members.forEach((member) => {
          memberUpdates[member.user.toString()] = {
            lastMessage: prevMessage
              ? {
                  messageId: prevMessage._id,
                  content: prevMessage.content,
                  createdAt: prevMessage.createdAt,
                }
              : null,
            unreadCount: member.unreadCount,
          };
        });
      }

      // Emit socket event
      socketEmitter.emitMessageDeleted(
        message.conversation.toString(),
        messageId.toString(),
        userId.toString(),
        memberUpdates
      );

      return {
        success: true,
        conversationId: message.conversation.toString(),
      };
    } catch (error) {
      console.error("❌ [MessageService] deleteMessage error:", error);
      throw error;
    }
  }
}

export default new MessageService();