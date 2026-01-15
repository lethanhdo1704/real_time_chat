// backend/services/group/group.join.js
import User from "../../models/User.js";
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import GroupNotification from "../../models/GroupNotification.js";
import GroupInviteLink from "../../models/GroupInviteLink.js";
import groupEmitter from "./group.emitter.js";
import groupPermissions from "./group.permissions.js";

class GroupJoin {
  /**
   * Send join request
   */
  async sendJoinRequest(conversationId, userId) {
    const [conversation, user] = await Promise.all([
      Conversation.findById(conversationId).select("name avatar type joinMode"),
      User.findById(userId).select("uid nickname avatar"),
    ]);

    if (!conversation || conversation.type !== "group") {
      throw new Error("INVALID_GROUP");
    }

    // ✅ Check if already ACTIVE member
    const existingMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: userId,
      leftAt: null  // ✅ CRITICAL: Only check active members
    });

    if (existingMember) {
      throw new Error("ALREADY_MEMBER");
    }

    // 🔥 NEW: Check if user was kicked
    const wasKicked = await ConversationMember.wasKicked(conversationId, userId);
    if (wasKicked) {
      throw new Error("USER_WAS_KICKED_CANNOT_REQUEST");
    }

    // Get all admins and owner (only active)
    const adminMembers = await ConversationMember.find({
      conversation: conversationId,
      role: { $in: ["owner", "admin"] },
      leftAt: null  // ✅ CRITICAL: Only active admins
    }).populate("user", "_id uid");

    if (adminMembers.length === 0) {
      throw new Error("NO_ADMINS_FOUND");
    }

    // Create notifications for each admin
    const uniqueKey = `join_request_${userId}_${conversationId}`;
    
    await Promise.all(
      adminMembers.map(member =>
        GroupNotification.createNotification({
          recipient: member.user._id,
          conversation: conversationId,
          type: "GROUP_JOIN_REQUEST",
          actor: userId,
          uniqueKey: `${uniqueKey}_${member.user._id}`,
          payload: {
            groupName: conversation.name,
          },
        })
      )
    );

    // Emit event
    groupEmitter.emitJoinRequest({
      user: {
        uid: user.uid,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      conversation: {
        id: conversationId,
        name: conversation.name,
      },
      adminUids: adminMembers.map(m => m.user.uid),
    });

    return { success: true };
  }

  /**
   * Approve join request
   * 🔥 PRODUCTION FIX: Handle rejoin after kick/leave
   */
  async approveJoinRequest(notificationId, approverId, requesterId) {
    const notification = await GroupNotification.findById(notificationId);

    if (!notification) {
      throw new Error("NOTIFICATION_NOT_FOUND");
    }

    if (notification.type !== "GROUP_JOIN_REQUEST") {
      throw new Error("INVALID_NOTIFICATION_TYPE");
    }

    // Check permission (approver must be active admin/owner)
    const canApprove = await groupPermissions.canApproveJoinRequest(
      notification.conversation,
      approverId
    );

    if (!canApprove) {
      throw new Error("UNAUTHORIZED");
    }

    // 🔥 CRITICAL FIX: Use rejoinMember with allowKickedRejoin = true
    // Admin approval overrides kick status
    try {
      await ConversationMember.rejoinMember(
        notification.conversation,
        requesterId,
        'member',
        true  // ✅ allowKickedRejoin = true (admin approved)
      );
    } catch (error) {
      if (error.message === 'USER_WAS_KICKED') {
        throw new Error('USER_WAS_KICKED_NEED_ADMIN_APPROVAL');
      }
      throw error;
    }

    // Delete ALL join request notifications from this user
    await GroupNotification.deleteMany({
      conversation: notification.conversation,
      actor: requesterId,
      type: "GROUP_JOIN_REQUEST",
    });

    // Create approved notification for requester
    await GroupNotification.createNotification({
      recipient: requesterId,
      conversation: notification.conversation,
      type: "GROUP_JOIN_APPROVED",
      actor: approverId,
      targetUser: requesterId,
    });

    const [approver, requester, conversation] = await Promise.all([
      User.findById(approverId).select("uid nickname avatar"),
      User.findById(requesterId).select("uid nickname avatar"),
      Conversation.findById(notification.conversation).select("name"),
    ]);

    // Emit events
    groupEmitter.emitJoinApproved({
      approver: {
        uid: approver.uid,
      },
      requester: {
        uid: requester.uid,
        nickname: requester.nickname,
        avatar: requester.avatar,
      },
      conversation: {
        id: notification.conversation,
        name: conversation.name,
      },
    });

    groupEmitter.emitMemberJoined({
      user: {
        uid: requester.uid,
        nickname: requester.nickname,
        avatar: requester.avatar,
      },
      conversation: {
        id: notification.conversation,
      },
    });

    return { success: true };
  }

  /**
   * Reject join request
   */
  async rejectJoinRequest(notificationId, rejecterId, requesterId) {
    const notification = await GroupNotification.findById(notificationId);

    if (!notification) {
      throw new Error("NOTIFICATION_NOT_FOUND");
    }

    if (notification.type !== "GROUP_JOIN_REQUEST") {
      throw new Error("INVALID_NOTIFICATION_TYPE");
    }

    // Check permission
    const canReject = await groupPermissions.canApproveJoinRequest(
      notification.conversation,
      rejecterId
    );

    if (!canReject) {
      throw new Error("UNAUTHORIZED");
    }

    // Delete ALL join request notifications from this user
    await GroupNotification.deleteMany({
      conversation: notification.conversation,
      actor: requesterId,
      type: "GROUP_JOIN_REQUEST",
    });

    // Create rejected notification for requester
    await GroupNotification.createNotification({
      recipient: requesterId,
      conversation: notification.conversation,
      type: "GROUP_JOIN_REJECTED",
      actor: rejecterId,
      targetUser: requesterId,
    });

    const [rejecter, requester] = await Promise.all([
      User.findById(rejecterId).select("uid"),
      User.findById(requesterId).select("uid"),
    ]);

    groupEmitter.emitJoinRejected({
      rejecter: {
        uid: rejecter.uid,
      },
      requester: {
        uid: requester.uid,
      },
      conversationId: notification.conversation,
    });

    return { success: true };
  }

  /**
   * Join via invite link
   * 🔥 PRODUCTION FIX: Handle rejoin after kick/leave
   */
  async joinViaLink(code, userId) {
    // Validate link
    const link = await GroupInviteLink.validateLink(code);
    
    const [user, creator] = await Promise.all([
      User.findById(userId).select("uid nickname avatar"),
      User.findById(link.createdBy).select("uid nickname avatar"),
    ]);

    // ✅ Check if already ACTIVE member
    const existingMember = await ConversationMember.findOne({
      conversation: link.conversation._id,
      user: userId,
      leftAt: null  // ✅ CRITICAL: Only check active members
    });

    if (existingMember) {
      throw new Error("ALREADY_MEMBER");
    }

    // Check creator role to determine auto-join
    const shouldAutoJoin = ["owner", "admin"].includes(link.creatorRole);

    if (shouldAutoJoin) {
      // 🔥 CRITICAL FIX: Admin/owner links can override kick status
      try {
        await ConversationMember.rejoinMember(
          link.conversation._id,
          userId,
          'member',
          true  // ✅ allowKickedRejoin = true (admin/owner link)
        );
      } catch (error) {
        if (error.message === 'USER_WAS_KICKED') {
          throw new Error('USER_WAS_KICKED_CANNOT_JOIN_VIA_LINK');
        }
        throw error;
      }

      // Increment link usage
      await GroupInviteLink.incrementUseCount(link._id);

      groupEmitter.emitMemberJoined({
        user: {
          uid: user.uid,
          nickname: user.nickname,
          avatar: user.avatar,
        },
        conversation: {
          id: link.conversation._id,
        },
        viaLink: true,
      });

      return {
        autoJoined: true,
        conversationId: link.conversation._id,
        conversation: link.conversation,
      };
    } else {
      // 🔥 Regular member's link: Check kick status first
      const wasKicked = await ConversationMember.wasKicked(link.conversation._id, userId);
      if (wasKicked) {
        throw new Error("USER_WAS_KICKED_CANNOT_JOIN_VIA_LINK");
      }

      // Create join request (regular member's link)
      await this.sendJoinRequest(link.conversation._id, userId);

      return {
        autoJoined: false,
        message: "Join request sent to admins",
      };
    }
  }

  /**
   * 🔥 NEW: Clear kick status (unban user)
   * Only owner/admin can do this
   */
  async clearKickStatus(conversationId, actorUid, targetUid) {
    // Verify actor is admin/owner
    const actorMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: actorUid,
      role: { $in: ["owner", "admin"] },
      leftAt: null
    });

    if (!actorMember) {
      throw new Error("UNAUTHORIZED");
    }

    // Clear kick status
    const result = await ConversationMember.clearKickStatus(conversationId, targetUid);

    if (!result) {
      throw new Error("USER_NOT_KICKED_OR_NOT_FOUND");
    }

    return { success: true, message: "User can now rejoin the group" };
  }
}

export default new GroupJoin();