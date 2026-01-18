// backend/services/group/management/member.kick.service.js
import Conversation from "../../../models/Conversation.js";
import ConversationMember from "../../../models/ConversationMember.js";
import GroupNotification from "../../../models/GroupNotification.js";
import groupEmitter from "../group.emitter.js";
import groupPermissions from "../group.permissions.js";
import userHelper from "./user.helper.service.js";

class MemberKickService {
  /**
   * Kick member from group
   */
  async kickMember(conversationId, actorUid, targetUid) {
    // Check if conversation is a group
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
    const canKick = await groupPermissions.canKick(
      conversationId,
      actor._id,
      target._id
    );

    if (!canKick) {
      throw new Error("UNAUTHORIZED_TO_KICK");
    }

    // softDeleteMember now sets both kickedBy AND kickedAt
    const member = await ConversationMember.softDeleteMember(
      conversationId,
      target._id,
      actor._id // Track who kicked this user
    );

    if (!member) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    // Create notification
    await GroupNotification.createNotification({
      recipient: target._id,
      conversation: conversationId,
      type: "GROUP_KICKED",
      actor: actor._id,
      targetUser: target._id,
    });

    // Emit event
    groupEmitter.emitMemberKicked({
      actor: {
        uid: actor.uid,
        nickname: actor.nickname,
        avatar: actor.avatar,
      },
      target: {
        uid: target.uid,
        nickname: target.nickname,
        avatar: target.avatar,
      },
      conversationId,
      kickedAt: member.kickedAt,
    });

    return {
      success: true,
      kickedAt: member.kickedAt,
    };
  }
}

export default new MemberKickService();