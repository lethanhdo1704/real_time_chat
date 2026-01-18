// backend/controllers/group.controller.js - MAIN CONTROLLER
import groupInfoController from "./group/group.info.controller.js";
import groupInviteController from "./group/group.invite.controller.js";
import groupJoinController from "./group/group.join.controller.js";
import groupInviteLinkController from "./group/group.invite-link.controller.js";
import groupManagementController from "./group/group.management.controller.js";
import groupNotificationController from "./group/group.notification.controller.js";

class GroupController {
  // ============================================
  // GROUP INFO
  // ============================================
  async getGroupInfo(req, res, next) {
    return groupInfoController.getGroupInfo(req, res, next);
  }

  // ============================================
  // INVITE USERS
  // ============================================
  async inviteUsers(req, res, next) {
    return groupInviteController.inviteUsers(req, res, next);
  }

  async acceptInvite(req, res, next) {
    return groupInviteController.acceptInvite(req, res, next);
  }

  async rejectInvite(req, res, next) {
    return groupInviteController.rejectInvite(req, res, next);
  }

  // ============================================
  // JOIN REQUESTS
  // ============================================
  async sendJoinRequest(req, res, next) {
    return groupJoinController.sendJoinRequest(req, res, next);
  }

  async approveJoinRequest(req, res, next) {
    return groupJoinController.approveJoinRequest(req, res, next);
  }

  async rejectJoinRequest(req, res, next) {
    return groupJoinController.rejectJoinRequest(req, res, next);
  }

  async joinViaLink(req, res, next) {
    return groupJoinController.joinViaLink(req, res, next);
  }

  // ============================================
  // INVITE LINKS
  // ============================================
  async createInviteLink(req, res, next) {
    return groupInviteLinkController.createInviteLink(req, res, next);
  }

  async getInviteLinks(req, res, next) {
    return groupInviteLinkController.getInviteLinks(req, res, next);
  }

  async deactivateInviteLink(req, res, next) {
    return groupInviteLinkController.deactivateInviteLink(req, res, next);
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================
  async kickMember(req, res, next) {
    return groupManagementController.kickMember(req, res, next);
  }

  async leaveGroup(req, res, next) {
    return groupManagementController.leaveGroup(req, res, next);
  }

  async changeMemberRole(req, res, next) {
    return groupManagementController.changeMemberRole(req, res, next);
  }

  async transferOwnership(req, res, next) {
    return groupManagementController.transferOwnership(req, res, next);
  }

  async transferOwnershipAndLeave(req, res, next) {
    return groupManagementController.transferOwnershipAndLeave(req, res, next);
  }

  async updateGroupInfo(req, res, next) {
    return groupManagementController.updateGroupInfo(req, res, next);
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  async getNotifications(req, res, next) {
    return groupNotificationController.getNotifications(req, res, next);
  }

  async markNotificationAsRead(req, res, next) {
    return groupNotificationController.markNotificationAsRead(req, res, next);
  }

  async markAllNotificationsAsRead(req, res, next) {
    return groupNotificationController.markAllNotificationsAsRead(req, res, next);
  }

  async getUnreadCount(req, res, next) {
    return groupNotificationController.getUnreadCount(req, res, next);
  }
}

export default new GroupController();