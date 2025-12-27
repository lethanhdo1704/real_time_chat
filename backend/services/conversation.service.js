// backend/services/conversation.service.js
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";

class ConversationService {
  /**
   * 🔥 NEW: Check if conversation exists with a friend
   * 
   * @param {string} userUid - Current user's uid (from JWT req.user.uid)
   * @param {string} friendUid - Friend's uid (from FE params)
   * @returns {Object} { exists: boolean, conversationId: string|null }
   */
  async checkConversation(userUid, friendUid) {
    try {
      console.log('🔍 [ConversationService] Checking conversation:', {
        userUid,
        friendUid
      });

      // STEP 1: Find friend by uid
      const friend = await User.findOne({ uid: friendUid })
        .select('_id')
        .lean();
      
      if (!friend) {
        console.log('❌ [ConversationService] Friend not found with uid:', friendUid);
        return {
          exists: false,
          conversationId: null
        };
      }

      // STEP 2: Find current user by uid
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id')
        .lean();

      if (!currentUser) {
        throw new Error('Current user not found');
      }

      console.log('✅ [ConversationService] Found users:', {
        currentUserId: currentUser._id,
        friendId: friend._id
      });

      // STEP 3: Find friendship (to get friendshipId)
      const friendship = await Friend.findOne({
        $or: [
          { user: currentUser._id, friend: friend._id },
          { user: friend._id, friend: currentUser._id }
        ],
        status: 'accepted'
      })
        .select('_id')
        .lean();

      if (!friendship) {
        console.log('❌ [ConversationService] Not friends');
        return {
          exists: false,
          conversationId: null
        };
      }

      // STEP 4: Find conversation by friendshipId
      const conversation = await Conversation.findOne({
        friendshipId: friendship._id,
        type: 'private',
        isDeleted: false
      })
        .select('_id')
        .lean();

      if (!conversation) {
        console.log('✅ [ConversationService] No conversation found');
        return {
          exists: false,
          conversationId: null
        };
      }

      // STEP 5: Verify both are still members (not left)
      const memberCount = await ConversationMember.countDocuments({
        conversation: conversation._id,
        user: { $in: [currentUser._id, friend._id] },
        leftAt: null
      });

      if (memberCount !== 2) {
        console.log('❌ [ConversationService] One or both users left conversation');
        return {
          exists: false,
          conversationId: null
        };
      }

      console.log('✅ [ConversationService] Conversation found:', conversation._id);

      return {
        exists: true,
        conversationId: conversation._id.toString()
      };

    } catch (error) {
      console.error('❌ [ConversationService] checkConversation error:', error.message);
      throw error;
    }
  }

  /**
   * Create private conversation (1-1 chat)
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
      console.error("❌ [ConversationService] createPrivate error:", error);
      throw error;
    }
  }

  /**
   * Create group conversation
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
      console.error("❌ [ConversationService] createGroup error:", error);
      throw error;
    }
  }

  /**
   * Get user's conversations for sidebar
   * 
   * ✅ FIXED: Convert uid to ObjectId before aggregate
   */
  async getUserConversations(userUid, limit = 20, offset = 0) {
    try {
      // ============================================
      // 🔥 FIX: Convert uid to MongoDB _id first
      // ============================================
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id')
        .lean();

      if (!currentUser) {
        throw new Error('User not found');
      }

      const userId = currentUser._id;

      // ============================================
      // Query conversations
      // ============================================
      const memberships = await ConversationMember.aggregate([
        {
          $match: {
            user: userId, // ✅ Now using ObjectId
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
          const unreadCount = membership.unreadCount;

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
              unreadCount,
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
              unreadCount,
            };
          }
        })
      );

      return conversations;
    } catch (error) {
      console.error("❌ [ConversationService] getUserConversations error:", error);
      throw error;
    }
  }

  /**
   * Get conversation detail
   * 
   * ✅ FIXED: Convert uid to ObjectId
   */
  async getConversationDetail(conversationId, userUid) {
    try {
      // Convert uid to _id
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id')
        .lean();

      if (!currentUser) {
        throw new Error('User not found');
      }

      const userId = currentUser._id;

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
    } catch (error) {
      console.error("❌ [ConversationService] getConversationDetail error:", error);
      throw error;
    }
  }

  /**
   * Mark conversation as read
   * 
   * ✅ FIXED: Convert uid to ObjectId
   */
  async markAsRead(conversationId, userUid) {
    try {
      console.log('✅ [ConversationService] Marking as read:', { conversationId, userUid });

      // Convert uid to _id
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id')
        .lean();

      if (!currentUser) {
        throw new Error('User not found');
      }

      const userId = currentUser._id;

      // Verify user is a member
      const isMember = await ConversationMember.isActiveMember(conversationId, userId);
      if (!isMember) {
        throw new Error("Not a member of this conversation");
      }

      // Get the last message in conversation
      const conversation = await Conversation.findById(conversationId);
      const lastMessageId = conversation?.lastMessage || null;

      // Use the static method from ConversationMember model
      const updatedMember = await ConversationMember.markAsRead(
        conversationId,
        userId,
        lastMessageId
      );

      if (!updatedMember) {
        throw new Error("Failed to mark as read");
      }

      console.log('✅ [ConversationService] Marked as read successfully');

      return {
        success: true,
        unreadCount: 0,
        lastSeenAt: updatedMember.lastSeenAt
      };
    } catch (error) {
      console.error("❌ [ConversationService] markAsRead error:", error);
      throw error;
    }
  }

  /**
   * Leave group
   * 
   * ✅ FIXED: Convert uid to ObjectId
   */
  async leaveGroup(conversationId, userUid) {
    try {
      // Convert uid to _id
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id')
        .lean();

      if (!currentUser) {
        throw new Error('User not found');
      }

      const userId = currentUser._id;

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

      // Owner must transfer ownership before leaving
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
    } catch (error) {
      console.error("❌ [ConversationService] leaveGroup error:", error);
      throw error;
    }
  }

  /**
   * Add members to group
   * 
   * ✅ FIXED: Convert uid to ObjectId
   */
  async addMembers(conversationId, adminUid, memberUids) {
    try {
      // Convert admin uid to _id
      const admin = await User.findOne({ uid: adminUid })
        .select('_id')
        .lean();

      if (!admin) {
        throw new Error('Admin user not found');
      }

      const adminId = admin._id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.type !== "group") {
        throw new Error("Invalid group conversation");
      }

      const adminMember = await ConversationMember.findOne({
        conversation: conversationId,
        user: adminId,
        leftAt: null,
      });

      if (!adminMember || !["owner", "admin"].includes(adminMember.role)) {
        throw new Error("Permission denied");
      }

      const users = await User.find({ uid: { $in: memberUids } });
      const userIds = users.map((u) => u._id);

      const newMembers = userIds.map((userId) => ({
        conversation: conversationId,
        user: userId,
        role: "member",
        unreadCount: 0,
      }));

      await ConversationMember.insertMany(newMembers, { ordered: false });

      return { success: true, added: users.length };
    } catch (error) {
      console.error("❌ [ConversationService] addMembers error:", error);
      throw error;
    }
  }

  /**
   * Remove member from group
   * 
   * ✅ FIXED: Convert uid to ObjectId
   */
  async removeMember(conversationId, adminUid, memberUid) {
    try {
      // Convert admin uid to _id
      const admin = await User.findOne({ uid: adminUid })
        .select('_id')
        .lean();

      if (!admin) {
        throw new Error('Admin user not found');
      }

      const adminId = admin._id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.type !== "group") {
        throw new Error("Invalid group conversation");
      }

      const adminMember = await ConversationMember.findOne({
        conversation: conversationId,
        user: adminId,
        leftAt: null,
      });

      if (!adminMember || !["owner", "admin"].includes(adminMember.role)) {
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
        adminMember.role === "admin"
      ) {
        throw new Error("Cannot remove admin or owner");
      }

      targetMember.leftAt = new Date();
      await targetMember.save();

      return { success: true };
    } catch (error) {
      console.error("❌ [ConversationService] removeMember error:", error);
      throw error;
    }
  }
}

export default new ConversationService();