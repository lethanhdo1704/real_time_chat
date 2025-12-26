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
import socketEmitter from "./socket.emitter.js";

class MessageService {
  /**
   * Inject socket emitter (called from socket/index.js)
   */
  setSocketEmitter(io) {
    socketEmitter.setIO(io);
    console.log("✅ SocketEmitter injected into MessageService");
  }

  /**
   * 🔥 SEND MESSAGE (CORE FUNCTION)
   */
  async sendMessage({
    conversationId,
    senderId,
    content,
    clientMessageId, // 🔥 NEW: From frontend
    type = "text",
    replyTo = null,
    attachments = [],
  }) {
    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Verify access
      const { conversation, member } = await verifyConversationAccess(
        conversationId,
        senderId,
        session
      );

      // 2️⃣ Create message
      const message = await createMessage({
        conversationId,
        senderId,
        content,
        clientMessageId,
        type,
        replyTo,
        attachments,
        session,
      });

      // 3️⃣ Update conversation's lastMessage
      await updateConversationLastMessage(
        conversationId,
        message._id,
        message.createdAt,
        session
      );

      // 4️⃣ Update sender's read status (unread = 0)
      await updateSenderRead(conversationId, senderId, message._id, session);

      // 5️⃣ Increment unread for others
      await incrementUnreadForOthers(conversationId, senderId, session);

      await session.commitTransaction();

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

      return { message: messageResponse };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get messages with pagination
   */
  async getMessages(conversationId, userId, before = null, limit = 50) {
    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    const isMember = await ConversationMember.isActiveMember(
      conversationId,
      userId
    );
    if (!isMember) {
      throw new Error("Not a member");
    }

    const query = {
      conversation: conversationId,
      deletedAt: null,
    };

    if (before && isValidObjectId(before)) {
      query._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("sender", "uid nickname avatar")
      .populate("replyTo", "content sender")
      .lean();

    return {
      messages: messages.map(formatMessageResponse),
      hasMore: messages.length === limit,
    };
  }

  /**
   * 🔥 MARK AS READ (CORE FUNCTION)
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const message = await Message.findById(messageId).session(session);
      if (!message) {
        throw new Error("Message not found");
      }

      verifyMessageOwnership(message, userId);

      // Soft delete
      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save({ session });

      // Update conversation's lastMessage if needed
      const prevMessage = await updateConversationAfterDeletion(
        message.conversation,
        messageId,
        session
      );

      let memberUpdates = {};

      if (prevMessage !== null) {
        // Get updated state for all members
        const members = await ConversationMember.find({
          conversation: message.conversation,
          leftAt: null,
        })
          .session(session)
          .lean();

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

      await session.commitTransaction();

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
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new MessageService();
