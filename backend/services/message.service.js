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
    allowedAttributes: {},
  });
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

class MessageService {
  constructor() {
    this.socketEmitter = null;
  }

  /**
   * Inject socket emitter (called from socket/index.js)
   */
  setSocketEmitter(socketEmitter) {
    this.socketEmitter = socketEmitter;
    console.log('✅ SocketEmitter injected into MessageService');
  }

  /**
   * 🔥 SEND MESSAGE (CORE FUNCTION)
   * ✅ Updates ConversationMember.unreadCount
   * ✅ Emits socket events
   * ✅ Uses transaction
   */
  async sendMessage({
    conversationId,
    senderId,
    content,
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
      // 1️⃣ Verify conversation exists
      const conversation = await Conversation.findById(conversationId).session(
        session
      );
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // 2️⃣ Verify sender is member
      const senderMember = await ConversationMember.findOne({
        conversation: conversationId,
        user: senderId,
        leftAt: null,
      }).session(session);

      if (!senderMember) {
        throw new Error("Not a member of this conversation");
      }

      // 3️⃣ For private chat, verify friendship
      if (conversation.type === "private") {
        const friendship = await Friend.findById(
          conversation.friendshipId
        ).session(session);
        if (!friendship || friendship.status !== "accepted") {
          throw new Error("Cannot send message - not friends");
        }
      }

      // 4️⃣ Create message
      const sanitizedContent = sanitizeContent(content);

      const message = await Message.create(
        [
          {
            conversation: conversationId,
            sender: senderId,
            content: sanitizedContent,
            type,
            replyTo,
            attachments,
          },
        ],
        { session }
      );

      // 5️⃣ Update conversation's lastMessage
      conversation.lastMessage = message[0]._id;
      conversation.lastMessageAt = message[0].createdAt;
      await conversation.save({ session });

      // 6️⃣ 🔥 Update sender's lastSeenMessage (unread = 0 for sender)
      senderMember.lastSeenMessage = message[0]._id;
      senderMember.lastSeenAt = new Date();
      senderMember.unreadCount = 0; // ✅ Sender always has 0 unread
      await senderMember.save({ session });

      // 7️⃣ 🔥🔥 Increment unreadCount for OTHER members
      await ConversationMember.updateMany(
        {
          conversation: conversationId,
          user: { $ne: senderId },
          leftAt: null,
        },
        {
          $inc: { unreadCount: 1 },
        },
        { session }
      );

      await session.commitTransaction();

      // 8️⃣ Populate sender data
      await message[0].populate("sender", "uid nickname avatar");

      // 9️⃣ Prepare response
      const messageResponse = {
        messageId: message[0]._id,
        conversation: conversationId,
        sender: {
          uid: message[0].sender.uid,
          nickname: message[0].sender.nickname,
          avatar: message[0].sender.avatar,
        },
        content: message[0].content,
        type: message[0].type,
        replyTo: message[0].replyTo,
        attachments: message[0].attachments,
        createdAt: message[0].createdAt,
        editedAt: message[0].editedAt || null,
      };

      // 🔟 🔥 Emit socket events with per-user data
      if (this.socketEmitter) {
        // Get all members with their updated unreadCount
        const allMembers = await ConversationMember.find({
          conversation: conversationId,
          leftAt: null,
        }).lean();

        const memberUpdates = {};
        allMembers.forEach((member) => {
          memberUpdates[member.user.toString()] = {
            unreadCount: member.unreadCount,
            lastSeenMessage: member.lastSeenMessage,
          };
        });

        this.socketEmitter.emitNewMessage(
          conversationId.toString(),
          messageResponse,
          memberUpdates
        );
      }

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
      messages: messages.map((msg) => ({
        messageId: msg._id,
        sender: msg.sender
          ? {
              uid: msg.sender.uid,
              nickname: msg.sender.nickname,
              avatar: msg.sender.avatar,
            }
          : null,
        content: msg.content,
        type: msg.type,
        replyTo: msg.replyTo
          ? {
              messageId: msg.replyTo._id,
              content: msg.replyTo.content,
            }
          : null,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
        editedAt: msg.editedAt || null,
      })),
      hasMore: messages.length === limit,
    };
  }

  /**
   * 🔥 MARK AS READ (CORE FUNCTION)
   * ✅ Resets unreadCount to 0
   * ✅ Emits socket events
   */
  async markAsRead(conversationId, userId) {
    if (!isValidObjectId(conversationId)) {
      throw new Error("Invalid conversationId");
    }

    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: userId,
      leftAt: null,
    });

    if (!member) {
      throw new Error("Not a member");
    }

    const lastMessage = await Message.findOne({
      conversation: conversationId,
      deletedAt: null,
    })
      .sort({ _id: -1 })
      .lean();

    if (!lastMessage) {
      return { success: true, lastSeenMessage: null };
    }

    // 🔥 Reset unreadCount to 0
    member.lastSeenMessage = lastMessage._id;
    member.lastSeenAt = new Date();
    member.unreadCount = 0; // ✅ Reset to 0
    await member.save();

    // 🔥 Emit socket event to other members
    if (this.socketEmitter) {
      const allMembers = await ConversationMember.find({
        conversation: conversationId,
        leftAt: null,
      }).lean();

      const memberIds = allMembers.map((m) => m.user.toString());

      this.socketEmitter.emitMessageRead(
        conversationId.toString(),
        userId.toString(),
        memberIds
      );
    }

    return {
      success: true,
      lastSeenMessage: lastMessage._id,
      lastSeenAt: member.lastSeenAt,
      unreadCount: 0,
    };
  }

  /**
   * ✅ FIXED: Get last messages for sidebar
   * Use ConversationMember.unreadCount instead of counting
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
          unreadCount: m.unreadCount, // ✅ Use from ConversationMember
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
        unreadCount: memberData.unreadCount, // ✅ From ConversationMember
        lastSeenMessage: memberData.lastSeenMessage || null,
      };
    });

    return result;
  }

  /**
   * Edit message
   * ✅ Emits socket event
   */
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

    const messageResponse = {
      messageId: message._id,
      conversation: message.conversation,
      sender: {
        uid: message.sender.uid,
        nickname: message.sender.nickname,
        avatar: message.sender.avatar,
      },
      content: message.content,
      type: message.type,
      replyTo: message.replyTo,
      attachments: message.attachments,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    };

    // Emit socket event
    if (this.socketEmitter) {
      this.socketEmitter.emitMessageEdited(
        message.conversation.toString(),
        messageResponse
      );
    }

    return { message: messageResponse };
  }

  /**
   * Delete message (soft delete)
   * ✅ Emits socket event with updated conversationUpdate
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

      if (message.sender.toString() !== userId.toString()) {
        throw new Error("Only message sender can delete");
      }

      if (message.deletedAt) {
        throw new Error("Message already deleted");
      }

      // Soft delete
      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save({ session });

      // Update conversation's lastMessage if needed
      const conversation = await Conversation.findById(
        message.conversation
      ).session(session);
      
      let memberUpdates = {};

      if (conversation?.lastMessage?.toString() === messageId.toString()) {
        const prevMessage = await Message.findOne({
          conversation: message.conversation,
          deletedAt: null,
          _id: { $ne: messageId },
        })
          .sort({ _id: -1 })
          .session(session)
          .lean();

        if (prevMessage) {
          conversation.lastMessage = prevMessage._id;
          conversation.lastMessageAt = prevMessage.createdAt;
        } else {
          conversation.lastMessage = null;
          conversation.lastMessageAt = null;
        }

        await conversation.save({ session });

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
      if (this.socketEmitter) {
        this.socketEmitter.emitMessageDeleted(
          message.conversation.toString(),
          messageId.toString(),
          userId.toString(),
          memberUpdates
        );
      }

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