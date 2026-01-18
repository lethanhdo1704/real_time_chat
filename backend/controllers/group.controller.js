// backend/controllers/group.controller.js - SIMPLIFIED VERSION
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
   */
  async getGroupInfo(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log(
        `📋 [GroupController] Getting group info for ${conversationId}`
      );

      const conversation = await Conversation.findById(conversationId).populate(
        "createdBy",
        "uid nickname avatar"
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "CONVERSATION_NOT_FOUND",
        });
      }

      const user = await User.findOne({ uid: req.user.uid });
      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: user._id,
        leftAt: null,
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "NOT_MEMBER",
        });
      }

      const members = await ConversationMember.find({
        conversation: conversationId,
        leftAt: null,
      })
        .populate("user", "uid nickname avatar")
        .select("role joinedAt")
        .lean();

      const roleOrder = { owner: 0, admin: 1, member: 2 };
      const formattedMembers = members
        .filter((m) => m.user)
        .sort((a, b) => {
          const roleDiff = roleOrder[a.role] - roleOrder[b.role];
          if (roleDiff !== 0) return roleDiff;
          return new Date(a.joinedAt) - new Date(b.joinedAt);
        })
        .map((m) => ({
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
          role: m.role,
          joinedAt: m.joinedAt,
        }));

      const groupInfo = {
        _id: conversation._id,
        type: conversation.type,
        name: conversation.name,
        avatar: conversation.avatar,
        createdBy: conversation.createdBy
          ? {
              uid: conversation.createdBy.uid,
              nickname: conversation.createdBy.nickname,
              avatar: conversation.createdBy.avatar,
            }
          : null,
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
        members: formattedMembers,
        totalMembers: formattedMembers.length,
        currentUserRole: member.role,
      };

      console.log(
        `✅ [GroupController] Group info retrieved with ${formattedMembers.length} members`
      );

      res.json({
        success: true,
        data: groupInfo,
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
   * 🛡️ Send join request - WITH DUPLICATE PREVENTION
   * POST /api/groups/:conversationId/join-request
   */
  async sendJoinRequest(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log(`📥 [GroupController] Join request for ${conversationId}`);

      // 🛡️ Check if user already has pending join request
      // This is handled by unique index in GroupNotification model
      const result = await groupJoin.sendJoinRequest(
        conversationId,
        req.user.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Handle duplicate join request error
      if (
        error.code === 11000 &&
        error.message.includes("one_pending_join_request")
      ) {
        return res.status(400).json({
          success: false,
          message: "PENDING_REQUEST_EXISTS",
          details: "You already have a pending join request for this group",
        });
      }

      console.error(
        "❌ [GroupController] sendJoinRequest error:",
        error.message
      );
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

      console.log(
        `✅ [GroupController] Approving join request ${notificationId}`
      );

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
      console.error(
        "❌ [GroupController] approveJoinRequest error:",
        error.message
      );
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

      console.log(
        `❌ [GroupController] Rejecting join request ${notificationId}`
      );

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
      console.error(
        "❌ [GroupController] rejectJoinRequest error:",
        error.message
      );
      next(error);
    }
  }

  // ============================================
  // 🔥 INVITE LINK METHODS
  // ============================================

  /**
   * 🛡️ Create invite link - ONE LINK PER USER (enforced by unique index)
   * POST /api/groups/:conversationId/invite-links
   */
  async createInviteLink(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { expiresIn, maxUses } = req.body || {};

      console.log(
        `🔗 [GroupController] Creating invite link for ${conversationId}`,
        {
          expiresIn,
          maxUses,
          userUid: req.user.uid,
        }
      );

      // Convert uid to MongoDB _id
      const user = await User.findOne({ uid: req.user.uid });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get member info
      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: user._id,
        leftAt: null,
      }).select("role");

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "Not a member of this group",
        });
      }

      // Calculate expiry date
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

      // Create invite link using static method (auto-deactivates old links)
      const link = await GroupInviteLink.createLink({
        conversation: conversationId,
        createdBy: user._id,
        creatorRole: member.role,
        expiresAt,
        maxUses: maxUses || null,
      });

      console.log(`✅ [GroupController] Invite link created: ${link.code}`);

      res.json({
        success: true,
        data: {
          _id: link._id,
          code: link.code,
          url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${link.code}`,
          expiresAt: link.expiresAt,
          maxUses: link.maxUses,
          usedCount: link.usedCount,
          isActive: link.isActive,
          creatorRole: link.creatorRole,
          createdAt: link.createdAt,
        },
      });
    } catch (error) {
      // Handle unique constraint violation (user already has active link)
      if (
        error.code === 11000 &&
        error.message.includes("one_active_link_per_user_per_group")
      ) {
        return res.status(400).json({
          success: false,
          message: "ACTIVE_LINK_EXISTS",
          details:
            "You already have an active invite link for this group. Please deactivate it first.",
        });
      }

      console.error(
        "❌ [GroupController] createInviteLink error:",
        error.message
      );
      next(error);
    }
  }

  /**
   * Get all invite links for a group
   * 🔒 ADMIN/OWNER ONLY
   * GET /api/groups/:conversationId/invite-links
   */
  async getInviteLinks(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log(
        `📋 [GroupController] Getting invite links for ${conversationId}`
      );

      // Convert uid to _id
      const user = await User.findOne({ uid: req.user.uid });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check membership AND role
      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: user._id,
        leftAt: null,
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "Not a member of this group",
        });
      }

      // 🔒 FIXED: Only owner can view all links
      if (member.role !== "owner") {
        return res.status(403).json({
          success: false,
          message: "UNAUTHORIZED",
          details: "Only the group owner can view all invite links",
        });
      }

      // Get all links for this conversation
      const links = await GroupInviteLink.find({
        conversation: conversationId,
      })
        .populate("createdBy", "uid nickname avatar")
        .sort({ createdAt: -1 })
        .lean();

      // Format response
      const formattedLinks = links.map((link) => ({
        _id: link._id,
        code: link.code,
        url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${link.code}`,
        createdBy: link.createdBy
          ? {
              uid: link.createdBy.uid,
              nickname: link.createdBy.nickname,
              avatar: link.createdBy.avatar,
            }
          : null,
        creatorRole: link.creatorRole,
        expiresAt: link.expiresAt,
        maxUses: link.maxUses,
        usedCount: link.usedCount,
        isActive: link.isActive,
        createdAt: link.createdAt,
      }));

      console.log(
        `✅ [GroupController] Found ${formattedLinks.length} invite links`
      );

      res.json({
        success: true,
        data: { links: formattedLinks },
      });
    } catch (error) {
      console.error(
        "❌ [GroupController] getInviteLinks error:",
        error.message
      );
      next(error);
    }
  }

  /**
   * Deactivate invite link
   * DELETE /api/groups/:conversationId/invite-links/:linkId
   */
  async deactivateInviteLink(req, res, next) {
    try {
      const { conversationId, linkId } = req.params;

      console.log(`🗑️ [GroupController] Deactivating link ${linkId}`);

      // Convert uid to _id
      const user = await User.findOne({ uid: req.user.uid });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user is admin/owner OR the creator of the link
      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: user._id,
        leftAt: null,
      });

      const link = await GroupInviteLink.findOne({
        _id: linkId,
        conversation: conversationId,
      });

      if (!link) {
        return res.status(404).json({
          success: false,
          message: "Invite link not found",
        });
      }

      // Check permission: admin/owner OR link creator
      const isAdminOrOwner = member && ["admin", "owner"].includes(member.role);
      const isCreator = link.createdBy.toString() === user._id.toString();

      if (!isAdminOrOwner && !isCreator) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to deactivate this link",
        });
      }

      // Deactivate link
      link.isActive = false;
      await link.save();

      console.log(`✅ [GroupController] Link deactivated: ${link.code}`);

      res.json({
        success: true,
        data: {
          _id: link._id,
          code: link.code,
          isActive: link.isActive,
        },
      });
    } catch (error) {
      console.error(
        "❌ [GroupController] deactivateInviteLink error:",
        error.message
      );
      next(error);
    }
  }

  // ============================================
  // END INVITE LINK METHODS
  // ============================================

  /**
   * Join via invite link
   * POST /api/groups/join/:code
   */
  async joinViaLink(req, res, next) {
    try {
      const { code } = req.params;

      console.log(
        `🔗 [GroupController] Join attempt via link ${code} by user ${req.user.id}`
      );

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

      console.log(
        `🚫 [GroupController] Kicking ${memberUid} from ${conversationId}`
      );

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

      console.log(
        `🚪 [GroupController] ${req.user.uid} leaving ${conversationId}`
      );

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
      console.error(
        "❌ [GroupController] changeMemberRole error:",
        error.message
      );
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

      console.log(
        `👑 [GroupController] Transferring ownership to ${newOwnerUid}`
      );

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
      console.error(
        "❌ [GroupController] transferOwnership error:",
        error.message
      );
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
      console.error(
        "❌ [GroupController] updateGroupInfo error:",
        error.message
      );
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

      console.log(
        `📬 [GroupController] Getting notifications for ${req.user.uid}`
      );

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
      console.error(
        "❌ [GroupController] getNotifications error:",
        error.message
      );
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
      console.error(
        "❌ [GroupController] markNotificationAsRead error:",
        error.message
      );
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
      console.error(
        "❌ [GroupController] markAllNotificationsAsRead error:",
        error.message
      );
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
      console.error(
        "❌ [GroupController] getUnreadCount error:",
        error.message
      );
      next(error);
    }
  }

  /**
   * Transfer ownership and leave group
   * POST /api/groups/:conversationId/transfer-and-leave
   */
  async transferOwnershipAndLeave(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { newOwnerUid } = req.body;

      if (!newOwnerUid) {
        return res.status(400).json({
          success: false,
          message: "newOwnerUid is required",
        });
      }

      console.log(
        `👑🚪 [GroupController] ${req.user.uid} transferring ownership to ${newOwnerUid} and leaving ${conversationId}`
      );

      const result = await groupManagement.transferOwnershipAndLeave(
        conversationId,
        req.user.uid,
        newOwnerUid
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        "❌ [GroupController] transferOwnershipAndLeave error:",
        error.message
      );
      next(error);
    }
  }
}

export default new GroupController();
