// backend/services/group/group.permissions.js
import ConversationMember from "../../models/ConversationMember.js";
import Conversation from "../../models/Conversation.js";

class GroupPermissions {
  /**
   * Get member role
   */
  async getMemberRole(conversationId, userId) {
    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: userId,
      leftAt: null,
    }).select("role").lean();
    
    return member?.role || null;
  }

  /**
   * Check if user can kick target
   */
  async canKick(conversationId, actorId, targetId) {
    const [actorMember, targetMember] = await Promise.all([
      ConversationMember.findOne({
        conversation: conversationId,
        user: actorId,
        leftAt: null,
      }).select("role").lean(),
      ConversationMember.findOne({
        conversation: conversationId,
        user: targetId,
        leftAt: null,
      }).select("role").lean(),
    ]);

    if (!actorMember || !targetMember) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    // Owner can kick anyone
    if (actorMember.role === "owner") {
      return true;
    }

    // Admin can only kick members
    if (actorMember.role === "admin") {
      return targetMember.role === "member";
    }

    // Members cannot kick
    return false;
  }

  /**
   * Check if user can change role
   */
  async canChangeRole(conversationId, actorId, targetId, newRole) {
    const actorMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: actorId,
      leftAt: null,
    }).select("role").lean();

    if (!actorMember) {
      throw new Error("NOT_MEMBER");
    }

    // Only owner can change roles
    if (actorMember.role !== "owner") {
      return false;
    }

    // Cannot change own role
    if (actorId.toString() === targetId.toString()) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can approve join requests
   */
  async canApproveJoinRequest(conversationId, userId) {
    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: userId,
      leftAt: null,
    }).select("role").lean();

    // Only owner and admin can approve
    return member && ["owner", "admin"].includes(member.role);
  }

  /**
   * Check if user can send messages
   */
  async canSendMessage(conversationId, userId) {
    const [conversation, member] = await Promise.all([
      Conversation.findById(conversationId).select("messagePermission").lean(),
      ConversationMember.findOne({
        conversation: conversationId,
        user: userId,
        leftAt: null,
      }).select("role").lean(),
    ]);

    if (!conversation || !member) {
      return false;
    }

    // If no restriction, everyone can send
    if (!conversation.messagePermission || conversation.messagePermission === "all") {
      return true;
    }

    // Only admins can send
    if (conversation.messagePermission === "admins_only") {
      return ["owner", "admin"].includes(member.role);
    }

    return false;
  }

  /**
   * Check if owner can leave (must transfer ownership first if >1 member)
   */
  async canOwnerLeave(conversationId, ownerId) {
    const activeMembersCount = await ConversationMember.countDocuments({
      conversation: conversationId,
      leftAt: null,
    });

    // Owner can leave if they're alone
    if (activeMembersCount === 1) {
      return true;
    }

    // Owner cannot leave if there are other members
    throw new Error("MUST_TRANSFER_OWNERSHIP");
  }
}

export default new GroupPermissions();