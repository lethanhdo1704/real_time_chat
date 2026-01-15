// backend/services/group/group.management.js
import User from "../../models/User.js";
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import GroupNotification from "../../models/GroupNotification.js";
import groupEmitter from "./group.emitter.js";
import groupPermissions from "./group.permissions.js";

class GroupManagement {
  async uidToUser(uid) {
    const user = await User.findOne({ uid }).select("_id uid nickname avatar");
    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  }

  /**
   * Kick member from group
   * 🔥 UNCHANGED: Already tracks kickedBy + kickedAt via softDeleteMember
   */
  async kickMember(conversationId, actorUid, targetUid) {
    // 🔥 NEW: Check if conversation is a group
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const [actor, target] = await Promise.all([
      this.uidToUser(actorUid),
      this.uidToUser(targetUid),
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

    // 🔥 CRITICAL: softDeleteMember now sets both kickedBy AND kickedAt
    const member = await ConversationMember.softDeleteMember(
      conversationId,
      target._id,
      actor._id  // ✅ Track who kicked this user
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
      kickedAt: member.kickedAt  // ✅ Include timestamp in event
    });

    return { 
      success: true,
      kickedAt: member.kickedAt
    };
  }

  /**
   * Leave group
   * 🔥 NEW: Added group type check - cannot leave private conversations
   */
  async leaveGroup(conversationId, userUid) {
    // 🔥 CRITICAL: Check if conversation is a group
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("CANNOT_LEAVE_PRIVATE_CONVERSATION");
    }

    const user = await this.uidToUser(userUid);

    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: user._id,
      leftAt: null,
    });

    if (!member) {
      throw new Error("NOT_MEMBER");
    }

    // Check if owner can leave
    if (member.role === "owner") {
      await groupPermissions.canOwnerLeave(conversationId, user._id);
    }

    // 🔥 CRITICAL: softDeleteMember with null = voluntary leave
    await ConversationMember.softDeleteMember(
      conversationId,
      user._id,
      null  // ✅ null = voluntary leave (kickedBy and kickedAt both null)
    );

    // Check if last member
    const remainingMembers = await ConversationMember.countDocuments({
      conversation: conversationId,
      leftAt: null,
    });

    if (remainingMembers === 0) {
      // Delete group
      await Conversation.findByIdAndUpdate(conversationId, {
        isDeleted: true,
      });

      groupEmitter.emitGroupDeleted({
        conversationId,
      });
    } else {
      // Emit member left
      groupEmitter.emitMemberLeft({
        user: {
          uid: user.uid,
          nickname: user.nickname,
          avatar: user.avatar,
        },
        conversationId,
      });
    }

    return { success: true };
  }

  /**
   * 🔥 NEW: Get kick history for a group
   * Only admins/owner can view this
   */
  async getKickHistory(conversationId, actorUid, limit = 50) {
    // 🔥 NEW: Check if conversation is a group
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const actor = await this.uidToUser(actorUid);

    // Check if admin/owner
    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: actor._id,
      role: { $in: ["owner", "admin"] },
      leftAt: null,
    });

    if (!member) {
      throw new Error("UNAUTHORIZED");
    }

    // Get kicked members
    const kickedMembers = await ConversationMember.getKickedMembers(
      conversationId, 
      limit
    );

    return {
      kickedMembers: kickedMembers.map(m => ({
        user: {
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
        },
        kickedBy: {
          uid: m.kickedBy.uid,
          nickname: m.kickedBy.nickname,
          avatar: m.kickedBy.avatar,
        },
        kickedAt: m.kickedAt,
        leftAt: m.leftAt,
        durationSinceKick: Date.now() - m.kickedAt.getTime()
      }))
    };
  }

  /**
   * 🔥 NEW: Check if user was kicked and get details
   * Useful for UI to show "You were kicked by X on Y"
   */
  async checkKickStatus(conversationId, userUid) {
    const user = await this.uidToUser(userUid);

    const kickInfo = await ConversationMember.getKickInfo(
      conversationId,
      user._id
    );

    if (!kickInfo) {
      return { wasKicked: false };
    }

    return {
      wasKicked: true,
      kickedBy: {
        uid: kickInfo.kickedBy.uid,
        nickname: kickInfo.kickedBy.nickname,
        avatar: kickInfo.kickedBy.avatar,
      },
      kickedAt: kickInfo.kickedAt,
      leftAt: kickInfo.leftAt
    };
  }

  /**
   * Change member role
   * 🔥 NEW: Added group type check
   */
  async changeMemberRole(conversationId, actorUid, targetUid, newRole) {
    // 🔥 NEW: Check if conversation is a group
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const [actor, target] = await Promise.all([
      this.uidToUser(actorUid),
      this.uidToUser(targetUid),
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

    // Get old role first
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

  /**
   * Transfer ownership
   * 🔥 NEW: Added group type check
   */
  async transferOwnership(conversationId, currentOwnerUid, newOwnerUid) {
    // 🔥 NEW: Check if conversation is a group
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const [currentOwner, newOwner] = await Promise.all([
      this.uidToUser(currentOwnerUid),
      this.uidToUser(newOwnerUid),
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
   * Update group info
   * 🔥 NEW: Added group type check + populate createdBy
   */
  async updateGroupInfo(conversationId, actorUid, updates) {
    // 🔥 NEW: Check if conversation is a group
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const actor = await this.uidToUser(actorUid);

    // Check if owner
    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: actor._id,
      role: "owner",
      leftAt: null,
    });

    if (!member) {
      throw new Error("ONLY_OWNER_CAN_UPDATE");
    }

    const allowedFields = ["name", "avatar", "messagePermission"];
    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // 🔥 CRITICAL: Update and populate createdBy with only public fields
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      updateData,
      { new: true }
    ).populate('createdBy', 'uid nickname avatar');

    if (updates.messagePermission) {
      groupEmitter.emitPermissionChanged({
        conversationId,
        newPermission: updates.messagePermission,
      });
    }

    // 🔥 Format response to hide MongoDB _id
    return {
      _id: updatedConversation._id,
      type: updatedConversation.type,
      name: updatedConversation.name,
      avatar: updatedConversation.avatar,
      createdBy: updatedConversation.createdBy ? {
        uid: updatedConversation.createdBy.uid,
        nickname: updatedConversation.createdBy.nickname,
        avatar: updatedConversation.createdBy.avatar
      } : null,
      joinMode: updatedConversation.joinMode,
      messagePermission: updatedConversation.messagePermission,
      totalMessages: updatedConversation.totalMessages,
      sharedImages: updatedConversation.sharedImages,
      sharedVideos: updatedConversation.sharedVideos,
      sharedAudios: updatedConversation.sharedAudios,
      sharedFiles: updatedConversation.sharedFiles,
      sharedLinks: updatedConversation.sharedLinks,
      isDeleted: updatedConversation.isDeleted,
      createdAt: updatedConversation.createdAt,
      updatedAt: updatedConversation.updatedAt
    };
  }
}

export default new GroupManagement();