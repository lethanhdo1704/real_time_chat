// backend/services/conversation/conversation.create.js
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import Friend from "../../models/Friend.js";
import User from "../../models/User.js";

/**
 * Conversation Create Service
 * Handles creating private and group conversations
 */
class ConversationCreateService {
  /**
   * Create private conversation (1-1 chat)
   * 
   * @param {string} userUid - Current user's uid
   * @param {string} friendUid - Friend's uid
   * @returns {Object} Created or existing conversation
   */
  async createPrivate(userUid, friendUid) {
    try {
      // Find friend by uid
      const friend = await User.findOne({ uid: friendUid });
      if (!friend) {
        throw new Error("User not found");
      }

      // Find current user by uid
      const currentUser = await User.findOne({ uid: userUid });
      if (!currentUser) {
        throw new Error("Current user not found");
      }

      // Verify friendship
      const friendship = await Friend.findOne({
        $or: [
          { user: currentUser._id, friend: friend._id },
          { user: friend._id, friend: currentUser._id },
        ],
        status: "accepted",
      });

      if (!friendship) {
        throw new Error("Not friends");
      }

      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        friendshipId: friendship._id,
      });

      if (conversation) {
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
          unreadCount: 0,
        };
      }

      // Create new conversation
      conversation = await Conversation.create({
        type: "private",
        friendshipId: friendship._id,
      });

      // Create members with unreadCount = 0
      await ConversationMember.insertMany([
        {
          conversation: conversation._id,
          user: currentUser._id,
          role: "member",
          unreadCount: 0,
        },
        {
          conversation: conversation._id,
          user: friend._id,
          role: "member",
          unreadCount: 0,
        },
      ]);

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
        unreadCount: 0,
      };
    } catch (error) {
      console.error("❌ [ConversationCreate] createPrivate error:", error);
      throw error;
    }
  }

  /**
   * Create group conversation
   * 
   * @param {string} userUid - Creator's uid
   * @param {string} name - Group name
   * @param {Array<string>} memberUids - Array of member uids
   * @returns {Object} Created group conversation
   */
  async createGroup(userUid, name, memberUids) {
    if (!memberUids || memberUids.length < 2) {
      throw new Error("Group must have at least 3 members (including you)");
    }

    try {
      // Find current user
      const currentUser = await User.findOne({ uid: userUid });
      if (!currentUser) {
        throw new Error("Current user not found");
      }

      // Find all members
      const members = await User.find({ uid: { $in: memberUids } });
      if (members.length !== memberUids.length) {
        throw new Error("Some users not found");
      }

      const memberIds = members.map((m) => m._id);

      // Verify all are friends with creator
      const friendships = await Friend.find({
        user: currentUser._id,
        friend: { $in: memberIds },
        status: "accepted",
      });

      if (friendships.length !== memberIds.length) {
        throw new Error("All members must be your friends");
      }

      // Create conversation
      const conversation = await Conversation.create({
        type: "group",
        name,
        createdBy: currentUser._id,
      });

      // Create members with unreadCount = 0
      const conversationMembers = [
        {
          conversation: conversation._id,
          user: currentUser._id,
          role: "owner",
          unreadCount: 0,
        },
        ...memberIds.map((id) => ({
          conversation: conversation._id,
          user: id,
          role: "member",
          unreadCount: 0,
        })),
      ];

      await ConversationMember.insertMany(conversationMembers);

      // Get full member details
      const allMembers = await ConversationMember.find({
        conversation: conversation._id,
      }).populate("user", "uid nickname avatar");

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
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
      };
    } catch (error) {
      console.error("❌ [ConversationCreate] createGroup error:", error);
      throw error;
    }
  }
}

export default new ConversationCreateService();