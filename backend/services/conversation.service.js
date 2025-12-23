// backend/services/conversation.service.js
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";

class ConversationService {
  async createPrivate(userId, friendUid) {
    const friend = await User.findOne({ uid: friendUid });
    if (!friend) {
      throw new Error("User not found");
    }

    const friendship = await Friend.findOne({
      $or: [
        { user: userId, friend: friend._id },
        { user: friend._id, friend: userId },
      ],
    });

    if (!friendship || friendship.status !== "accepted") {
      throw new Error("Not friends");
    }

    const conversation = await Conversation.findOrCreatePrivate(
      userId,
      friend._id,
      friendship._id
    );

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
    };
  }

  async createGroup(userId, name, memberUids) {
    if (!memberUids || memberUids.length < 2) {
      throw new Error("Group must have at least 3 members");
    }

    const members = await User.find({ uid: { $in: memberUids } });
    if (members.length !== memberUids.length) {
      throw new Error("Some users not found");
    }

    const memberIds = members.map((m) => m._id);

    const friendships = await Friend.find({
      user: userId,
      friend: { $in: memberIds },
      status: "accepted",
    });

    if (friendships.length !== memberIds.length) {
      throw new Error("All members must be your friends");
    }

    const conversation = await Conversation.create({
      type: "group",
      name,
      createdBy: userId,
    });

    const conversationMembers = [
      { conversation: conversation._id, user: userId, role: "owner" },
      ...memberIds.map((id) => ({
        conversation: conversation._id,
        user: id,
        role: "member",
      })),
    ];

    await ConversationMember.insertMany(conversationMembers);

    const allMembers = await ConversationMember.getActiveMembers(
      conversation._id
    );
    const creator = await User.findById(userId);

    return {
      conversationId: conversation._id,
      type: "group",
      name: conversation.name,
      avatar: conversation.avatar,
      members: allMembers.map((m) => ({
        uid: m.user.uid,
        nickname: m.user.nickname,
        avatar: m.user.avatar,
        role: m.role,
      })),
      createdBy: { uid: creator.uid },
    };
  }

  async getUserConversations(userId, limit = 20, offset = 0) {
    const memberships = await ConversationMember.find({
      user: userId,
      leftAt: null,
    })
      .populate("conversation")
      .sort({ "conversation.lastMessageAt": -1 })
      .skip(offset)
      .limit(limit);

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const conv = membership.conversation;

        let lastMessage = null;
        if (conv.lastMessage) {
          const msg = await Message.findById(conv.lastMessage).populate(
            "sender",
            "uid nickname avatar"
          );

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

        // ✅ FIX: Only count messages from OTHER users (not from current user)
        let unreadCount;

        if (membership.lastSeenMessage) {
          unreadCount = await Message.countDocuments({
            conversation: conv._id,
            _id: { $gt: membership.lastSeenMessage },
            sender: { $ne: userId }, // ✅ ADDED: Exclude current user's messages
            deletedAt: null,
          });
        } else {
          unreadCount = await Message.countDocuments({
            conversation: conv._id,
            sender: { $ne: userId }, // ✅ ADDED: Exclude current user's messages
            deletedAt: null,
          });
        }

        if (conv.type === "private") {
          const otherMember = await ConversationMember.findOne({
            conversation: conv._id,
            user: { $ne: userId },
          }).populate("user", "uid nickname avatar");

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
            unreadCount, // ✅ Now returns correct count
          };
        } else {
          const members = await ConversationMember.getActiveMembers(conv._id);

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
            unreadCount, // ✅ Now returns correct count
          };
        }
      })
    );

    return conversations;
  }

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

  async leaveGroup(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      throw new Error("Invalid group conversation");
    }

    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: userId,
      leftAt: null,
    });

    if (!member) {
      throw new Error("Not a member");
    }

    if (member.role === "owner") {
      const otherMembers = await ConversationMember.countDocuments({
        conversation: conversationId,
        leftAt: null,
        user: { $ne: userId },
      });

      if (otherMembers > 0) {
        throw new Error("Owner must transfer ownership before leaving");
      }
    }

    member.leftAt = new Date();
    await member.save();

    return { success: true };
  }

  async addMembers(conversationId, adminId, memberUids) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      throw new Error("Invalid group conversation");
    }

    const admin = await ConversationMember.findOne({
      conversation: conversationId,
      user: adminId,
      leftAt: null,
    });

    if (!admin || !["owner", "admin"].includes(admin.role)) {
      throw new Error("Permission denied");
    }

    const users = await User.find({ uid: { $in: memberUids } });
    const userIds = users.map((u) => u._id);

    const newMembers = userIds.map((userId) => ({
      conversation: conversationId,
      user: userId,
      role: "member",
    }));

    await ConversationMember.insertMany(newMembers, { ordered: false });

    return { success: true, added: users.length };
  }

  async removeMember(conversationId, adminId, memberUid) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      throw new Error("Invalid group conversation");
    }

    const admin = await ConversationMember.findOne({
      conversation: conversationId,
      user: adminId,
      leftAt: null,
    });

    if (!admin || !["owner", "admin"].includes(admin.role)) {
      throw new Error("Permission denied");
    }

    const targetUser = await User.findOne({ uid: memberUid });
    if (!targetUser) {
      throw new Error("User not found");
    }

    const targetMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: targetUser._id,
      leftAt: null,
    });

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
    await targetMember.save();

    return { success: true };
  }
}

export default new ConversationService();