// backend/services/conversation/conversation.query.js
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import Message from "../../models/Message.js";
import Friend from "../../models/Friend.js";
import User from "../../models/User.js";

/**
 * Conversation Query Service
 * Handles getting conversation lists and details
 */
class ConversationQueryService {
  /**
   * Check if conversation exists with a friend
   * 
   * @param {string} userUid - Current user's uid (from JWT req.user.uid)
   * @param {string} friendUid - Friend's uid (from FE params)
   * @returns {Object} { exists: boolean, conversationId: string|null }
   */
  async checkConversation(userUid, friendUid) {
    try {
      console.log('🔍 [ConversationQuery] Checking conversation:', {
        userUid,
        friendUid
      });

      // STEP 1: Find friend by uid
      const friend = await User.findOne({ uid: friendUid })
        .select('_id')
        .lean();
      
      if (!friend) {
        console.log('❌ [ConversationQuery] Friend not found with uid:', friendUid);
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

      console.log('✅ [ConversationQuery] Found users:', {
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
        console.log('❌ [ConversationQuery] Not friends');
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
        console.log('✅ [ConversationQuery] No conversation found');
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
        console.log('❌ [ConversationQuery] One or both users left conversation');
        return {
          exists: false,
          conversationId: null
        };
      }

      console.log('✅ [ConversationQuery] Conversation found:', conversation._id);

      return {
        exists: true,
        conversationId: conversation._id.toString()
      };

    } catch (error) {
      console.error('❌ [ConversationQuery] checkConversation error:', error.message);
      throw error;
    }
  }

  /**
   * Get user's conversations for sidebar
   * 
   * @param {string} userUid - User's uid
   * @param {number} limit - Number of conversations to return
   * @param {number} offset - Pagination offset
   * @returns {Array} List of conversations
   */
  async getUserConversations(userUid, limit = 20, offset = 0) {
    try {
      // Convert uid to MongoDB _id first
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id')
        .lean();

      if (!currentUser) {
        throw new Error('User not found');
      }

      const userId = currentUser._id;

      // Query conversations
      const memberships = await ConversationMember.aggregate([
        {
          $match: {
            user: userId,
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
      console.error("❌ [ConversationQuery] getUserConversations error:", error);
      throw error;
    }
  }

  /**
   * Get conversation detail
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} userUid - User's uid
   * @returns {Object} Conversation detail
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
      console.error("❌ [ConversationQuery] getConversationDetail error:", error);
      throw error;
    }
  }
}

export default new ConversationQueryService();