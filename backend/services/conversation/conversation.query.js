// backend/services/conversation/conversation.query.js - FULL FIXED VERSION
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import Message from "../../models/Message.js";
import Friend from "../../models/Friend.js";
import User from "../../models/User.js";

/**
 * Conversation Query Service
 * Handles getting conversation lists and details
 * 
 * 🔥 FIXED: Filter lastMessage based on hiddenFor
 * 🔥 FIXED: Proper member structure with nested user object
 * 🔥 FIXED: Added messagePermission to group responses
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
   * 🔥 FIXED: Filter lastMessage if hidden by user or recalled
   * 🔥 FIXED: Added messagePermission to group responses
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

            // ============================================
            // 🔥 FIX: Check if message is visible for this user
            // ============================================
            if (msg && !msg.deletedAt) {
              // Check if user hid this message
              const isHidden = msg.hiddenFor?.some(
                (hiddenUserId) => hiddenUserId.toString() === userId.toString()
              );

              // 🔥 If hidden or recalled, handle appropriately
              if (isHidden) {
                console.log('🔍 [ConversationQuery] lastMessage hidden by user, finding alternative');
                
                // Find the last message that is:
                // 1. Not deleted by admin
                // 2. Not hidden by this user
                // 3. Older than current lastMessage
                const alternativeMsg = await Message.findOne({
                  conversation: conv._id,
                  deletedAt: null,
                  hiddenFor: { $ne: userId },
                  _id: { $lt: msg._id }, // Older than current lastMessage
                })
                  .sort({ _id: -1 })
                  .populate("sender", "uid nickname avatar")
                  .lean();

                if (alternativeMsg) {
                  lastMessage = {
                    messageId: alternativeMsg._id,
                    sender: {
                      uid: alternativeMsg.sender.uid,
                      nickname: alternativeMsg.sender.nickname,
                    },
                    content: alternativeMsg.content,
                    type: alternativeMsg.type,
                    createdAt: alternativeMsg.createdAt,
                    isRecalled: alternativeMsg.isRecalled || false,
                  };
                }
                // If no alternative found, lastMessage stays null
              } else if (msg.isRecalled) {
                // 🔥 Recalled message - show placeholder
                lastMessage = {
                  messageId: msg._id,
                  sender: {
                    uid: msg.sender.uid,
                    nickname: msg.sender.nickname,
                  },
                  content: msg.content, // Should be empty if backend cleared it
                  type: msg.type,
                  createdAt: msg.createdAt,
                  isRecalled: true,
                  recalledAt: msg.recalledAt,
                };
              } else {
                // Message is visible normally
                lastMessage = {
                  messageId: msg._id,
                  sender: {
                    uid: msg.sender.uid,
                    nickname: msg.sender.nickname,
                  },
                  content: msg.content,
                  type: msg.type,
                  createdAt: msg.createdAt,
                  isRecalled: false,
                };
              }
            }
          }

          // ============================================
          // Build conversation object
          // ============================================
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
            // ============================================
            // 🔥 GROUP CONVERSATION - FIXED
            // ============================================
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
              messagePermission: conv.messagePermission || 'all', // ✅ FIXED: Added messagePermission
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
   * 🔥 FIXED: Now includes lastSeenMessage for read receipts
   * 🔥 FIXED: Proper member structure with nested user object for frontend compatibility
   * 🔥 FIXED: Added messagePermission to group response
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

      // 🔥 FIX: Get full member data with lastSeenMessage and kick info
      const memberDocs = await ConversationMember.find({
        conversation: conversationId,
        leftAt: null
      })
        .populate('user', 'uid nickname avatar')
        .populate('kickedBy', 'uid nickname avatar')
        .select('user role lastSeenMessage lastSeenAt leftAt kickedBy kickedAt')
        .lean();

      console.log('📥 [ConversationQuery] Found members with read data:', memberDocs.length);

      // 🔥 CRITICAL FIX: Format members to have user data at BOTH root and nested level
      // This ensures compatibility with frontend useGroupPermissions hook
      const formattedMembers = memberDocs.map((m) => ({
        // ✅ User data at root level (for backward compatibility)
        uid: m.user.uid,
        nickname: m.user.nickname,
        avatar: m.user.avatar,
        
        // ✅ ALSO include nested user object (for useGroupPermissions hook)
        user: {
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
        },
        
        // Member-specific data
        role: m.role,
        lastSeenMessage: m.lastSeenMessage?.toString() || null,
        lastSeenAt: m.lastSeenAt || null,
        leftAt: m.leftAt || null,
        
        // Kick info (if kicked)
        kickedBy: m.kickedBy ? {
          uid: m.kickedBy.uid,
          nickname: m.kickedBy.nickname,
          avatar: m.kickedBy.avatar,
        } : null,
        kickedAt: m.kickedAt || null,
      }));

      if (conversation.type === "private") {
        return {
          conversationId: conversation._id,
          type: "private",
          members: formattedMembers,

          // optional – giữ cho sidebar / logic cũ
          friend: (() => {
            const otherMember = memberDocs.find(
              (m) => m.user._id.toString() !== userId.toString()
            );
            return otherMember
              ? {
                  uid: otherMember.user.uid,
                  nickname: otherMember.user.nickname,
                  avatar: otherMember.user.avatar,
                }
              : null;
          })(),
        };
      } else {
        // ============================================
        // 🔥 GROUP CONVERSATION - FIXED
        // ============================================
        return {
          conversationId: conversation._id,
          type: "group",
          name: conversation.name,
          avatar: conversation.avatar,
          messagePermission: conversation.messagePermission || 'all', // ✅ FIXED: Added messagePermission
          members: formattedMembers,
        };
      }

    } catch (error) {
      console.error("❌ [ConversationQuery] getConversationDetail error:", error);
      throw error;
    }
  }
}

export default new ConversationQueryService();