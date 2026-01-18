// backend/controllers/group/group.join.controller.js
import groupJoin from "../../services/group/group.join.js";

class GroupJoinController {
  /**
   * 🛡️ Send join request - WITH DUPLICATE PREVENTION
   * POST /api/groups/:conversationId/join-request
   */
  async sendJoinRequest(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log(`📥 [GroupJoinController] Join request for ${conversationId}`);

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
        "❌ [GroupJoinController] sendJoinRequest error:",
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
        `✅ [GroupJoinController] Approving join request ${notificationId}`
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
        "❌ [GroupJoinController] approveJoinRequest error:",
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
        `❌ [GroupJoinController] Rejecting join request ${notificationId}`
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
        "❌ [GroupJoinController] rejectJoinRequest error:",
        error.message
      );
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

      console.log(
        `🔗 [GroupJoinController] Join attempt via link ${code} by user ${req.user.id}`
      );

      const result = await groupJoin.joinViaLink(code, req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ [GroupJoinController] joinViaLink error:", error.message);
      next(error);
    }
  }
}

export default new GroupJoinController();