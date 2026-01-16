// backend/controllers/group.controller.js
import groupInvite from "../services/group/group.invite.js";
import groupJoin from "../services/group/group.join.js";
import groupManagement from "../services/group/group.management.js";
import GroupInviteLink from "../models/GroupInviteLink.js";
import ConversationMember from "../models/ConversationMember.js";
import GroupNotification from "../models/GroupNotification.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

class GroupController {
  /**
   * Get group info
   * GET /api/groups/:conversationId
   * 🔥 UPDATED: Now returns members list + current user role
   */
  async getGroupInfo(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log(`📋 [GroupController] Getting group info for ${conversationId}`);

      // Get conversation with populated createdBy
      const conversation = await Conversation.findById(conversationId)
        .populate('createdBy', 'uid nickname avatar');

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "CONVERSATION_NOT_FOUND"
        });
      }

      // Check if user is member
      const user = await User.findOne({ uid: req.user.uid });
      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: user._id,
        leftAt: null
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "NOT_MEMBER"
        });
      }

      // 🔥 NEW: Get all active members
      const members = await ConversationMember.find({
        conversation: conversationId,
        leftAt: null
      })
      .populate('user', 'uid nickname avatar')
      .select('role joinedAt')
      .lean(); // Use lean() for better performance

      // 🔥 NEW: Format and sort members (owner -> admin -> member -> by join date)
      const roleOrder = { owner: 0, admin: 1, member: 2 };
      const formattedMembers = members
        .filter(m => m.user) // Filter out any members with missing user data
        .sort((a, b) => {
          // Sort by role first
          const roleDiff = roleOrder[a.role] - roleOrder[b.role];
          if (roleDiff !== 0) return roleDiff;
          // Then by join date (earliest first)
          return new Date(a.joinedAt) - new Date(b.joinedAt);
        })
        .map(m => ({
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
          role: m.role,
          joinedAt: m.joinedAt
        }));

      // Format response - only expose uid, not MongoDB _id
      const groupInfo = {
        _id: conversation._id,
        type: conversation.type,
        name: conversation.name,
        avatar: conversation.avatar,
        createdBy: conversation.createdBy ? {
          uid: conversation.createdBy.uid,
          nickname: conversation.createdBy.nickname,
          avatar: conversation.createdBy.avatar
        } : null,
        joinMode: conversation.joinMode,
        messagePermission: conversation.messagePermission,
        totalMessages: conversation.totalMessages,
        sharedImages: conversation.sharedImages,
        sharedVideos: conversation.sharedVideos,
        sharedAudios: conversation.sharedAudios,
        sharedFiles: conversation.sharedFiles,
        sharedLinks: conversation.sharedLinks,
        isDeleted: conversation.isDeleted,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        // 🔥 NEW: Add members list
        members: formattedMembers,
        totalMembers: formattedMembers.length,
        // 🔥 NEW: Add current user's role for UI permissions
        currentUserRole: member.role
      };

      console.log(`✅ [GroupController] Group info retrieved with ${formattedMembers.length} members`);

      res.json({
        success: true,
        data: groupInfo
      });

    } catch (error) {
      console.error("❌ [GroupController] getGroupInfo error:", error.message);
      next(error);
    }
  }

  /**
   * Invite users to group
   * POST /api/groups/:conversationId/invite
   */
  async inviteUsers(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { userUids } = req.body;

      if (!Array.isArray(userUids) || userUids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "userUids array is required",
        });
      }

      console.log(`📨 [GroupController] Inviting users to ${conversationId}`);

      const results = await groupInvite.inviteUsers(
        conversationId,
        req.user.uid,
        userUids
      );

      res.json({
        success: true,
        data: { results },
      });
    } catch (error) {
      console.error("❌ [GroupController] inviteUsers error:", error.message);
      next(error);
    }
  }

  /**
   * Accept group invite
   * POST /api/groups/invites/:notificationId/accept
   */
  async acceptInvite(req, res, next) {
    try {
      const { notificationId } = req.params;

      console.log(`✅ [GroupController] Accepting invite ${notificationId}`);

      const result = await groupInvite.acceptInvite(
        notificationId,
        req.user.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] acceptInvite error:", error.message);
      next(error);
    }
  }

  /**
   * Reject group invite
   * POST /api/groups/invites/:notificationId/reject
   */
  async rejectInvite(req, res, next) {
    try {
      const { notificationId } = req.params;

      console.log(`❌ [GroupController] Rejecting invite ${notificationId}`);

      const result = await groupInvite.rejectInvite(
        notificationId,
        req.user.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] rejectInvite error:", error.message);
      next(error);
    }
  }

  /**
   * Send join request
   * POST /api/groups/:conversationId/join-request
   */
  async sendJoinRequest(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log(`📥 [GroupController] Join request for ${conversationId}`);

      const result = await groupJoin.sendJoinRequest(
        conversationId,
        req.user.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] sendJoinRequest error:", error.message);
      next(error);
    }
  }

  /**
   * Approve join request
   * POST /api/groups/join-requests/:notificationId/approve
   */
  async approveJoinRequest(req, res, next) {
    try {
      const { notificationId } = req.params;
      const { requesterId } = req.body;

      if (!requesterId) {
        return res.status(400).json({
          success: false,
          message: "requesterId is required",
        });
      }

      console.log(`✅ [GroupController] Approving join request ${notificationId}`);

      const result = await groupJoin.approveJoinRequest(
        notificationId,
        req.user.id,
        requesterId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] approveJoinRequest error:", error.message);
      next(error);
    }
  }

  /**
   * Reject join request
   * POST /api/groups/join-requests/:notificationId/reject
   */
  async rejectJoinRequest(req, res, next) {
    try {
      const { notificationId } = req.params;
      const { requesterId } = req.body;

      if (!requesterId) {
        return res.status(400).json({
          success: false,
          message: "requesterId is required",
        });
      }

      console.log(`❌ [GroupController] Rejecting join request ${notificationId}`);

      const result = await groupJoin.rejectJoinRequest(
        notificationId,
        req.user.id,
        requesterId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] rejectJoinRequest error:", error.message);
      next(error);
    }
  }

  /**
   * Create invite link
   * POST /api/groups/:conversationId/invite-link
   */
  async createInviteLink(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { expiresIn, maxUses } = req.body;

      // Get member info
      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: req.user.id,
        leftAt: null,
      }).select("role");

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "Not a member of this group",
        });
      }

      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

      const link = await GroupInviteLink.create({
        conversation: conversationId,
        createdBy: req.user.id,
        creatorRole: member.role,
        expiresAt,
        maxUses: maxUses || null,
      });

      res.json({
        success: true,
        data: {
          code: link.code,
          url: `${process.env.FRONTEND_URL}/join/${link.code}`,
          expiresAt: link.expiresAt,
          maxUses: link.maxUses,
          creatorRole: link.creatorRole,
        },
      });
    } catch (error) {
      console.error("❌ [GroupController] createInviteLink error:", error.message);
      next(error);
    }
  }

  /**
   * Join via invite link
   * POST /api/groups/join/:code
   */
  async joinViaLink(req, res, next) {
    try {
      const { code } = req.params;

      console.log(`🔗 [GroupController] Joining via link ${code}`);

      const result = await groupJoin.joinViaLink(code, req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] joinViaLink error:", error.message);
      next(error);
    }
  }

  /**
   * Kick member
   * DELETE /api/groups/:conversationId/members/:memberUid
   */
  async kickMember(req, res, next) {
    try {
      const { conversationId, memberUid } = req.params;

      console.log(`🚫 [GroupController] Kicking ${memberUid} from ${conversationId}`);

      const result = await groupManagement.kickMember(
        conversationId,
        req.user.uid,
        memberUid
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] kickMember error:", error.message);
      next(error);
    }
  }

  /**
   * Leave group
   * POST /api/groups/:conversationId/leave
   */
  async leaveGroup(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log(`🚪 [GroupController] ${req.user.uid} leaving ${conversationId}`);

      const result = await groupManagement.leaveGroup(
        conversationId,
        req.user.uid
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] leaveGroup error:", error.message);
      next(error);
    }
  }

  /**
   * Change member role
   * PATCH /api/groups/:conversationId/members/:memberUid/role
   */
  async changeMemberRole(req, res, next) {
    try {
      const { conversationId, memberUid } = req.params;
      const { role } = req.body;

      if (!["admin", "member"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be 'admin' or 'member'",
        });
      }

      console.log(`👑 [GroupController] Changing role ${memberUid} → ${role}`);

      const result = await groupManagement.changeMemberRole(
        conversationId,
        req.user.uid,
        memberUid,
        role
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] changeMemberRole error:", error.message);
      next(error);
    }
  }

  /**
   * Transfer ownership
   * POST /api/groups/:conversationId/transfer-ownership
   */
  async transferOwnership(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { newOwnerUid } = req.body;

      if (!newOwnerUid) {
        return res.status(400).json({
          success: false,
          message: "newOwnerUid is required",
        });
      }

      console.log(`👑 [GroupController] Transferring ownership to ${newOwnerUid}`);

      const result = await groupManagement.transferOwnership(
        conversationId,
        req.user.uid,
        newOwnerUid
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] transferOwnership error:", error.message);
      next(error);
    }
  }

  /**
   * Update group info
   * PATCH /api/groups/:conversationId
   */
  async updateGroupInfo(req, res, next) {
    try {
      const { conversationId } = req.params;
      const updates = req.body;

      console.log(`✏️ [GroupController] Updating group ${conversationId}`);

      const result = await groupManagement.updateGroupInfo(
        conversationId,
        req.user.uid,
        updates
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupController] updateGroupInfo error:", error.message);
      next(error);
    }
  }

  /**
   * Get group notifications
   * GET /api/groups/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const { limit = 20, skip = 0, type } = req.query;

      console.log(`📬 [GroupController] Getting notifications for ${req.user.uid}`);

      const notifications = await GroupNotification.getUserNotifications(
        req.user.id,
        {
          limit: parseInt(limit),
          skip: parseInt(skip),
          type,
        }
      );

      res.json({
        success: true,
        data: { notifications },
      });
    } catch (error) {
      console.error("❌ [GroupController] getNotifications error:", error.message);
      next(error);
    }
  }

  /**
   * Mark notification as read
   * POST /api/groups/notifications/:notificationId/read
   */
  async markNotificationAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;

      await GroupNotification.markAsRead([notificationId], req.user.id);

      res.json({
        success: true,
      });
    } catch (error) {
      console.error("❌ [GroupController] markNotificationAsRead error:", error.message);
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * POST /api/groups/notifications/read-all
   */
  async markAllNotificationsAsRead(req, res, next) {
    try {
      await GroupNotification.markAllAsRead(req.user.id);

      res.json({
        success: true,
      });
    } catch (error) {
      console.error("❌ [GroupController] markAllNotificationsAsRead error:", error.message);
      next(error);
    }
  }

  /**
   * Get unread notification count
   * GET /api/groups/notifications/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const count = await GroupNotification.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("❌ [GroupController] getUnreadCount error:", error.message);
      next(error);
    }
  }
}

export default new GroupController();