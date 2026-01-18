// backend/services/group/management/ownership.service.js
import Conversation from "../../../models/Conversation.js";
import ConversationMember from "../../../models/ConversationMember.js";
import GroupNotification from "../../../models/GroupNotification.js";
import groupEmitter from "../group.emitter.js";
import userHelper from "./user.helper.service.js";

class OwnershipService {
  /**
   * Transfer ownership
   */
  async transferOwnership(conversationId, currentOwnerUid, newOwnerUid) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const [currentOwner, newOwner] = await Promise.all([
      userHelper.uidToUser(currentOwnerUid),
      userHelper.uidToUser(newOwnerUid),
    ]);

    // Verify current owner
    const ownerMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentOwner._id,
      role: "owner",
      leftAt: null,
    });

    if (!ownerMember) {
      throw new Error("NOT_OWNER");
    }

    // Verify new owner is member
    const newOwnerMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: newOwner._id,
      leftAt: null,
    });

    if (!newOwnerMember) {
      throw new Error("TARGET_NOT_MEMBER");
    }

    // Transfer ownership
    await Promise.all([
      ConversationMember.findByIdAndUpdate(ownerMember._id, {
        role: "admin",
      }),
      ConversationMember.findByIdAndUpdate(newOwnerMember._id, {
        role: "owner",
      }),
    ]);

    // Create notifications
    await Promise.all([
      GroupNotification.createNotification({
        recipient: newOwner._id,
        conversation: conversationId,
        type: "GROUP_ROLE_CHANGED",
        actor: currentOwner._id,
        targetUser: newOwner._id,
        payload: { newRole: "owner", oldRole: newOwnerMember.role },
      }),
      GroupNotification.createNotification({
        recipient: currentOwner._id,
        conversation: conversationId,
        type: "GROUP_ROLE_CHANGED",
        actor: currentOwner._id,
        targetUser: currentOwner._id,
        payload: { newRole: "admin", oldRole: "owner" },
      }),
    ]);

    groupEmitter.emitRoleChanged({
      actor: {
        uid: currentOwner.uid,
      },
      target: {
        uid: newOwner.uid,
      },
      conversationId,
      newRole: "owner",
    });

    return { success: true };
  }

  /**
   * Transfer ownership and leave group
   */
  async transferOwnershipAndLeave(
    conversationId,
    currentOwnerUid,
    newOwnerUid
  ) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const [currentOwner, newOwner] = await Promise.all([
      userHelper.uidToUser(currentOwnerUid),
      userHelper.uidToUser(newOwnerUid),
    ]);

    // Verify current owner
    const ownerMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentOwner._id,
      role: "owner",
      leftAt: null,
    });

    if (!ownerMember) {
      throw new Error("NOT_OWNER");
    }

    // Verify new owner is member
    const newOwnerMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: newOwner._id,
      leftAt: null,
    });

    if (!newOwnerMember) {
      throw new Error("TARGET_NOT_MEMBER");
    }

    // Transfer ownership
    await ConversationMember.findByIdAndUpdate(newOwnerMember._id, {
      role: "owner",
    });

    // Remove current owner
    const leftMember = await ConversationMember.softDeleteMember(
      conversationId,
      currentOwner._id,
      null
    );

    // Create notification
    await GroupNotification.createNotification({
      recipient: newOwner._id,
      conversation: conversationId,
      type: "GROUP_ROLE_CHANGED",
      actor: currentOwner._id,
      targetUser: newOwner._id,
      payload: { newRole: "owner", oldRole: newOwnerMember.role },
    });

    // Emit events
    groupEmitter.emitRoleChanged({
      actor: {
        uid: currentOwner.uid,
      },
      target: {
        uid: newOwner.uid,
        nickname: newOwner.nickname,
        avatar: newOwner.avatar,
      },
      conversationId,
      newRole: "owner",
    });

    groupEmitter.emitMemberLeft({
      user: {
        uid: currentOwner.uid,
        nickname: currentOwner.nickname,
        avatar: currentOwner.avatar,
      },
      conversationId,
    });

    return {
      success: true,
      conversationId,
      leftAt: leftMember.leftAt,
      newOwner: {
        uid: newOwner.uid,
        nickname: newOwner.nickname,
        avatar: newOwner.avatar,
      },
    };
  }
}

export default new OwnershipService();