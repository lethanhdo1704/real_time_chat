// backend/controllers/group/group.invite.controller.js
import groupInvite from "../../services/group/group.invite.js";

class GroupInviteController {
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

      console.log(`📨 [GroupInviteController] Inviting users to ${conversationId}`);

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
      console.error("❌ [GroupInviteController] inviteUsers error:", error.message);
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

      console.log(`✅ [GroupInviteController] Accepting invite ${notificationId}`);

      const result = await groupInvite.acceptInvite(
        notificationId,
        req.user.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupInviteController] acceptInvite error:", error.message);
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

      console.log(`❌ [GroupInviteController] Rejecting invite ${notificationId}`);

      const result = await groupInvite.rejectInvite(
        notificationId,
        req.user.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupInviteController] rejectInvite error:", error.message);
      next(error);
    }
  }
}

export default new GroupInviteController();