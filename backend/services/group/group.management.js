// backend/services/group/group.management.js - MAIN SERVICE
import memberKickService from "./management/member.kick.service.js";
import memberLeaveService from "./management/member.leave.service.js";
import memberRoleService from "./management/member.role.service.js";
import ownershipService from "./management/ownership.service.js";
import groupUpdateService from "./management/group.update.service.js";
import kickHistoryService from "./management/kick.history.service.js";

class GroupManagement {
  // ============================================
  // MEMBER KICK
  // ============================================
  async kickMember(conversationId, actorUid, targetUid) {
    return memberKickService.kickMember(conversationId, actorUid, targetUid);
  }

  async getKickHistory(conversationId, actorUid, limit = 50) {
    return kickHistoryService.getKickHistory(conversationId, actorUid, limit);
  }

  async checkKickStatus(conversationId, userUid) {
    return kickHistoryService.checkKickStatus(conversationId, userUid);
  }

  // ============================================
  // MEMBER LEAVE
  // ============================================
  async leaveGroup(conversationId, userUid) {
    return memberLeaveService.leaveGroup(conversationId, userUid);
  }

  // ============================================
  // MEMBER ROLE
  // ============================================
  async changeMemberRole(conversationId, actorUid, targetUid, newRole) {
    return memberRoleService.changeMemberRole(
      conversationId,
      actorUid,
      targetUid,
      newRole
    );
  }

  // ============================================
  // OWNERSHIP TRANSFER
  // ============================================
  async transferOwnership(conversationId, currentOwnerUid, newOwnerUid) {
    return ownershipService.transferOwnership(
      conversationId,
      currentOwnerUid,
      newOwnerUid
    );
  }

  async transferOwnershipAndLeave(
    conversationId,
    currentOwnerUid,
    newOwnerUid
  ) {
    return ownershipService.transferOwnershipAndLeave(
      conversationId,
      currentOwnerUid,
      newOwnerUid
    );
  }

  // ============================================
  // GROUP UPDATE
  // ============================================
  async updateGroupInfo(conversationId, actorUid, updates) {
    return groupUpdateService.updateGroupInfo(
      conversationId,
      actorUid,
      updates
    );
  }
}

export default new GroupManagement();