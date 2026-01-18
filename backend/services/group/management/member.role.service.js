// backend/services/group/management/member.role.service.js
import Conversation from "../../../models/Conversation.js";
import ConversationMember from "../../../models/ConversationMember.js";
import GroupNotification from "../../../models/GroupNotification.js";
import groupEmitter from "../group.emitter.js";
import groupPermissions from "../group.permissions.js";
import userHelper from "./user.helper.service.js";

class MemberRoleService {
  /**
   * Change member role
   */
  async changeMemberRole(conversationId, actorUid, targetUid, newRole) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const [actor, target] = await Promise.all([
      userHelper.uidToUser(actorUid),
      userHelper.uidToUser(targetUid),
    ]);

    // Check permission
    const canChange = await groupPermissions.canChangeRole(
      conversationId,
      actor._id,
      target._id,
      newRole
    );

    if (!canChange) {
      throw new Error("UNAUTHORIZED_TO_CHANGE_ROLE");
    }

    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: target._id,
      leftAt: null,
    });

    if (!member) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    const oldRole = member.role;

    // Update role
    member.role = newRole;
    await member.save();

    // Create notification
    await GroupNotification.createNotification({
      recipient: target._id,
      conversation: conversationId,
      type: "GROUP_ROLE_CHANGED",
      actor: actor._id,
      targetUser: target._id,
      payload: {
        newRole,
        oldRole,
      },
    });

    // Emit event
    groupEmitter.emitRoleChanged({
      actor: {
        uid: actor.uid,
      },
      target: {
        uid: target.uid,
        nickname: target.nickname,
        avatar: target.avatar,
      },
      conversationId,
      newRole,
    });

    return {
      success: true,
      newRole,
    };
  }
}

export default new MemberRoleService();