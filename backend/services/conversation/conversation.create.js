// backend/services/conversation/conversation.create.js - FIXED BIDIRECTIONAL CHECK
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import Friend from "../../models/Friend.js";
import User from "../../models/User.js";

/**
 * Conversation Create Service
 * Handles creating private and group conversations
 * 
 * 🔥 FIXED: Proper bidirectional friendship verification
 */
class ConversationCreateService {
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

      // Verify friendship (bidirectional)
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
   * 🔥 FIXED: Proper bidirectional friendship check
   */
  async createGroup(userUid, name, memberUids) {
    if (!memberUids || memberUids.length < 2) {
      throw new Error("Group must have at least 3 members (including you)");
    }

    try {
      console.log('🆕 [ConversationCreate] Creating group:', { 
        name, 
        creator: userUid, 
        memberCount: memberUids.length 
      });

      // Find current user
      const currentUser = await User.findOne({ uid: userUid });
      if (!currentUser) {
        throw new Error("Current user not found");
      }

      // Find all members
      const members = await User.find({ uid: { $in: memberUids } });
      if (members.length !== memberUids.length) {
        console.error('❌ [ConversationCreate] Some users not found:', {
          requested: memberUids.length,
          found: members.length
        });
        throw new Error("Some users not found");
      }

      // 🔥 CRITICAL FIX: Filter out the creator from members list
      // Only check friendship with OTHER members, not with yourself!
      const otherMembers = members.filter(
        (m) => m._id.toString() !== currentUser._id.toString()
      );

      console.log('👥 [ConversationCreate] Member filtering:', {
        total: members.length,
        creator: currentUser._id.toString(),
        others: otherMembers.length,
        otherMemberIds: otherMembers.map(m => m._id.toString())
      });

      if (otherMembers.length < 2) {
        throw new Error("Group must have at least 2 other members (excluding you)");
      }

      const memberIds = otherMembers.map((m) => m._id);

      console.log('🔍 [ConversationCreate] Checking friendships for members:', {
        currentUserId: currentUser._id,
        memberIds: memberIds.map(id => id.toString())
      });

      // 🔥 FIXED: Check each member individually for bidirectional friendship
      const friendshipChecks = await Promise.all(
        memberIds.map(async (memberId) => {
          const friendship = await Friend.findOne({
            $or: [
              // Current user sent friend request to member
              {
                user: currentUser._id,
                friend: memberId,
                status: "accepted",
              },
              // Member sent friend request to current user
              {
                user: memberId,
                friend: currentUser._id,
                status: "accepted",
              },
            ],
          });

          return {
            memberId: memberId.toString(),
            isFriend: !!friendship,
          };
        })
      );

      console.log('✅ [ConversationCreate] Friendship check results:', friendshipChecks);

      // Find members who are NOT friends
      const notFriends = friendshipChecks.filter((check) => !check.isFriend);

      if (notFriends.length > 0) {
        console.error('❌ [ConversationCreate] Not friends with:', notFriends.map(nf => nf.memberId));
        
        // Get user info for better error message
        const notFriendUsers = await User.find({
          _id: { $in: notFriends.map(nf => nf.memberId) }
        }).select('uid nickname');
        
        console.error('❌ [ConversationCreate] Missing friendships with users:', 
          notFriendUsers.map(u => ({ uid: u.uid, nickname: u.nickname }))
        );
        
        throw new Error("All members must be your friends");
      }

      console.log('✅ [ConversationCreate] All members are friends with creator');

      // Create conversation
      const conversation = await Conversation.create({
        type: "group",
        name,
        createdBy: currentUser._id,
        messagePermission: "all",
      });

      console.log('✅ [ConversationCreate] Conversation created:', conversation._id);

      // 🔥 Create members: Creator (owner) + Other members
      // memberIds already excludes the creator, so we add creator separately
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

      console.log('✅ [ConversationCreate] Members created:', {
        total: conversationMembers.length,
        owner: 1,
        members: memberIds.length
      });

      // Get full member details
      const allMembers = await ConversationMember.find({
        conversation: conversation._id,
      })
        .populate("user", "uid nickname avatar")
        .lean();

      // Format members with nested user object
      const formattedMembers = allMembers.map((m) => ({
        // User data at root
        uid: m.user.uid,
        nickname: m.user.nickname,
        avatar: m.user.avatar,
        
        // Nested user object (for useGroupPermissions hook)
        user: {
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
        },
        
        // Member data
        role: m.role,
        lastSeenMessage: null,
        lastSeenAt: null,
        leftAt: null,
        kickedBy: null,
        kickedAt: null,
      }));

      console.log('✅ [ConversationCreate] Formatted members:', formattedMembers.length);

      // Wrap in conversation object
      const result = {
        conversation: {
          conversationId: conversation._id,
          type: "group",
          name: conversation.name,
          avatar: conversation.avatar,
          messagePermission: conversation.messagePermission,
          members: formattedMembers,
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0,
        }
      };

      console.log('✅ [ConversationCreate] Group created successfully');

      return result;
    } catch (error) {
      console.error("❌ [ConversationCreate] createGroup error:", error);
      throw error;
    }
  }
}

export default new ConversationCreateService();