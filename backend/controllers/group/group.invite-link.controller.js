// backend/controllers/group/group.invite-link.controller.js
import GroupInviteLink from "../../models/GroupInviteLink.js";
import ConversationMember from "../../models/ConversationMember.js";
import User from "../../models/User.js";

class GroupInviteLinkController {
  /**
   * 🛡️ Create invite link - ONE LINK PER USER (enforced by unique index)
   * POST /api/groups/:conversationId/invite-links
   */
  async createInviteLink(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { expiresIn, maxUses } = req.body || {};

      console.log(
        `🔗 [GroupInviteLinkController] Creating invite link for ${conversationId}`,
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

      console.log(`✅ [GroupInviteLinkController] Invite link created: ${link.code}`);

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
        "❌ [GroupInviteLinkController] createInviteLink error:",
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
        `📋 [GroupInviteLinkController] Getting invite links for ${conversationId}`
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
        `✅ [GroupInviteLinkController] Found ${formattedLinks.length} invite links`
      );

      res.json({
        success: true,
        data: { links: formattedLinks },
      });
    } catch (error) {
      console.error(
        "❌ [GroupInviteLinkController] getInviteLinks error:",
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

      console.log(`🗑️ [GroupInviteLinkController] Deactivating link ${linkId}`);

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

      console.log(`✅ [GroupInviteLinkController] Link deactivated: ${link.code}`);

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
        "❌ [GroupInviteLinkController] deactivateInviteLink error:",
        error.message
      );
      next(error);
    }
  }
}

export default new GroupInviteLinkController();