// backend/controllers/group/group.management.controller.js
import groupManagement from "../../services/group/group.management.js";

class GroupManagementController {
  /**
   * Kick member
   * DELETE /api/groups/:conversationId/members/:memberUid
   */
  async kickMember(req, res, next) {
    try {
      const { conversationId, memberUid } = req.params;

      console.log(
        `🚫 [GroupManagementController] Kicking ${memberUid} from ${conversationId}`
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
      console.error("❌ [GroupManagementController] kickMember error:", error.message);
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
        `🚪 [GroupManagementController] ${req.user.uid} leaving ${conversationId}`
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
      console.error("❌ [GroupManagementController] leaveGroup error:", error.message);
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

      console.log(`👑 [GroupManagementController] Changing role ${memberUid} → ${role}`);

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
        "❌ [GroupManagementController] changeMemberRole error:",
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
        `👑 [GroupManagementController] Transferring ownership to ${newOwnerUid}`
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
        "❌ [GroupManagementController] transferOwnership error:",
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

      console.log(`✏️ [GroupManagementController] Updating group ${conversationId}`);

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
        "❌ [GroupManagementController] updateGroupInfo error:",
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
        `👑🚪 [GroupManagementController] ${req.user.uid} transferring ownership to ${newOwnerUid} and leaving ${conversationId}`
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
        "❌ [GroupManagementController] transferOwnershipAndLeave error:",
        error.message
      );
      next(error);
    }
  }
}

export default new GroupManagementController();