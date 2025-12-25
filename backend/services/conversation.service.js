// backend/services/conversation.service.js
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";

class ConversationService {
  /**
   * Create private conversation (1-1 chat)
   * Uses transaction to ensure atomicity
   */
  async createPrivate(userId, friendUid) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find friend by uid
      const friend = await User.findOne({ uid: friendUid }).session(session);
      if (!friend) {
        throw new Error("User not found");
      }

      // Verify friendship
      const friendship = await Friend.findOne({
        $or: [
          { user: userId, friend: friend._id },
          { user: friend._id, friend: userId },
        ],
        status: "accepted",
      }).session(session);

      if (!friendship) {
        throw new Error("Not friends");
      }

      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        friendshipId: friendship._id,
      }).session(session);

      if (conversation) {
        await session.commitTransaction();
        
        // Return existing conversation with friend info
        return {
          conversationId: conversation._id,
          type: "private",
          friend: {
            uid: friend.uid,
            nickname: friend.nickname,
            avatar: friend.avatar,
          },
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0, // Will be calculated from ConversationMember
        };
      }

      // Create new conversation
      conversation = await Conversation.create(
        [
          {
            type: "private",
            friendshipId: friendship._id,
          },
        ],
        { session }
      );

      // Create members with unreadCount = 0
      await ConversationMember.insertMany(
        [
          {
            conversation: conversation[0]._id,
            user: userId,
            role: "member",
            unreadCount: 0,
          },
          {
            conversation: conversation[0]._id,
            user: friend._id,
            role: "member",
            unreadCount: 0,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return {
        conversationId: conversation[0]._id,
        type: "private",
        friend: {
          uid: friend.uid,
          nickname: friend.nickname,
          avatar: friend.avatar,
        },
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Create group conversation
   * Uses transaction to ensure atomicity
   */
  async createGroup(userId, name, memberUids) {
    if (!memberUids || memberUids.length < 2) {
      throw new Error("Group must have at least 3 members (including you)");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find all members
      const members = await User.find({ uid: { $in: memberUids } }).session(
        session
      );
      if (members.length !== memberUids.length) {
        throw new Error("Some users not found");
      }

      const memberIds = members.map((m) => m._id);

      // Verify all are friends with creator
      const friendships = await Friend.find({
        user: userId,
        friend: { $in: memberIds },
        status: "accepted",
      }).session(session);

      if (friendships.length !== memberIds.length) {
        throw new Error("All members must be your friends");
      }

      // Create conversation
      const conversation = await Conversation.create(
        [
          {
            type: "group",
            name,
            createdBy: userId,
          },
        ],
        { session }
      );

      // Create members with unreadCount = 0
      const conversationMembers = [
        {
          conversation: conversation[0]._id,
          user: userId,
          role: "owner",
          unreadCount: 0,
        },
        ...memberIds.map((id) => ({
          conversation: conversation[0]._id,
          user: id,
          role: "member",
          unreadCount: 0,
        })),
      ];

      await ConversationMember.insertMany(conversationMembers, { session });

      await session.commitTransaction();

      // Get full member details
      const allMembers = await ConversationMember.find({
        conversation: conversation[0]._id,
      }).populate("user", "uid nickname avatar");

      return {
        conversationId: conversation[0]._id,
        type: "group",
        name: conversation[0].name,
        avatar: conversation[0].avatar,
        members: allMembers.map((m) => ({
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
          role: m.role,
        })),
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get user's conversations for sidebar
   * ✅ FIXED: Use aggregate for better performance
   * ✅ Use ConversationMember.unreadCount instead of counting
   */
  async getUserConversations(userId, limit = 20, offset = 0) {
    // Get user's memberships with conversation data
    const memberships = await ConversationMember.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          leftAt: null,
        },
      },
      {
        $lookup: {
          from: "conversations",
          localField: "conversation",
          foreignField: "_id",
          as: "conversationData",
        },
      },
      { $unwind: "$conversationData" },
      { $sort: { "conversationData.lastMessageAt": -1 } },
      { $skip: offset },
      { $limit: limit },
    ]);

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const conv = membership.conversationData;
        const unreadCount = membership.unreadCount; // ✅ Use from ConversationMember

        let lastMessage = null;
        if (conv.lastMessage) {
          const msg = await Message.findById(conv.lastMessage)
            .populate("sender", "uid nickname avatar")
            .lean();

          if (msg && !msg.deletedAt) {
            lastMessage = {
              sender: {
                uid: msg.sender.uid,
                nickname: msg.sender.nickname,
              },
              content: msg.content,
              createdAt: msg.createdAt,
            };
          }
        }

        if (conv.type === "private") {
          const otherMember = await ConversationMember.findOne({
            conversation: conv._id,
            user: { $ne: userId },
          })
            .populate("user", "uid nickname avatar")
            .lean();

          return {
            conversationId: conv._id,
            type: "private",
            friend: {
              uid: otherMember.user.uid,
              nickname: otherMember.user.nickname,
              avatar: otherMember.user.avatar,
            },
            lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount, // ✅ From ConversationMember
          };
        } else {
          const members = await ConversationMember.find({
            conversation: conv._id,
            leftAt: null,
          })
            .populate("user", "uid nickname avatar")
            .lean();

          return {
            conversationId: conv._id,
            type: "group",
            name: conv.name,
            avatar: conv.avatar,
            members: members.map((m) => ({
              uid: m.user.uid,
              nickname: m.user.nickname,
              avatar: m.user.avatar,
            })),
            lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount, // ✅ From ConversationMember
          };
        }
      })
    );

    return conversations;
  }

  /**
   * Get conversation detail
   */
  async getConversationDetail(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const isMember = await ConversationMember.isActiveMember(
      conversationId,
      userId
    );
    if (!isMember) {
      throw new Error("Not a member");
    }

    const members = await ConversationMember.getActiveMembers(conversationId);

    if (conversation.type === "private") {
      const otherMember = members.find(
        (m) => m.user._id.toString() !== userId.toString()
      );
      return {
        conversationId: conversation._id,
        type: "private",
        friend: {
          uid: otherMember.user.uid,
          nickname: otherMember.user.nickname,
          avatar: otherMember.user.avatar,
        },
      };
    } else {
      return {
        conversationId: conversation._id,
        type: "group",
        name: conversation.name,
        avatar: conversation.avatar,
        members: members.map((m) => ({
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
          role: m.role,
        })),
      };
    }
  }

  /**
   * Leave group (with transaction)
   */
  async leaveGroup(conversationId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const conversation = await Conversation.findById(conversationId).session(
        session
      );
      if (!conversation || conversation.type !== "group") {
        throw new Error("Invalid group conversation");
      }

      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: userId,
        leftAt: null,
      }).session(session);

      if (!member) {
        throw new Error("Not a member");
      }

      // Owner must transfer ownership before leaving
      if (member.role === "owner") {
        const otherMembers = await ConversationMember.countDocuments({
          conversation: conversationId,
          leftAt: null,
          user: { $ne: userId },
        }).session(session);

        if (otherMembers > 0) {
          throw new Error("Owner must transfer ownership before leaving");
        }
      }

      member.leftAt = new Date();
      await member.save({ session });

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Add members to group
   */
  async addMembers(conversationId, adminId, memberUids) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const conversation = await Conversation.findById(conversationId).session(
        session
      );
      if (!conversation || conversation.type !== "group") {
        throw new Error("Invalid group conversation");
      }

      const admin = await ConversationMember.findOne({
        conversation: conversationId,
        user: adminId,
        leftAt: null,
      }).session(session);

      if (!admin || !["owner", "admin"].includes(admin.role)) {
        throw new Error("Permission denied");
      }

      const users = await User.find({ uid: { $in: memberUids } }).session(
        session
      );
      const userIds = users.map((u) => u._id);

      const newMembers = userIds.map((userId) => ({
        conversation: conversationId,
        user: userId,
        role: "member",
        unreadCount: 0, // ✅ Initialize unreadCount
      }));

      await ConversationMember.insertMany(newMembers, {
        session,
        ordered: false,
      });

      await session.commitTransaction();
      return { success: true, added: users.length };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Remove member from group
   */
  async removeMember(conversationId, adminId, memberUid) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const conversation = await Conversation.findById(conversationId).session(
        session
      );
      if (!conversation || conversation.type !== "group") {
        throw new Error("Invalid group conversation");
      }

      const admin = await ConversationMember.findOne({
        conversation: conversationId,
        user: adminId,
        leftAt: null,
      }).session(session);

      if (!admin || !["owner", "admin"].includes(admin.role)) {
        throw new Error("Permission denied");
      }

      const targetUser = await User.findOne({ uid: memberUid }).session(
        session
      );
      if (!targetUser) {
        throw new Error("User not found");
      }

      const targetMember = await ConversationMember.findOne({
        conversation: conversationId,
        user: targetUser._id,
        leftAt: null,
      }).session(session);

      if (!targetMember) {
        throw new Error("User is not a member");
      }

      if (
        ["owner", "admin"].includes(targetMember.role) &&
        admin.role === "admin"
      ) {
        throw new Error("Cannot remove admin or owner");
      }

      targetMember.leftAt = new Date();
      await targetMember.save({ session });

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new ConversationService();