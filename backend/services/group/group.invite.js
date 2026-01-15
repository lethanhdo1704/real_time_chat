// backend/services/group/group.invite.js
import User from "../../models/User.js";
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import GroupNotification from "../../models/GroupNotification.js";
import groupEmitter from "./group.emitter.js";

class GroupInvite {
  /**
   * Convert uid → User object
   */
  async uidToUser(uid) {
    const user = await User.findOne({ uid }).select("_id uid nickname avatar");
    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  }

  /**
   * Invite users to group
   */
  async inviteUsers(conversationId, actorUid, inviteeUids) {
    const actor = await this.uidToUser(actorUid);
    
    // Check if actor is member
    const actorMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: actor._id,
      leftAt: null,
    });

    if (!actorMember) {
      throw new Error("NOT_MEMBER");
    }

    const conversation = await Conversation.findById(conversationId).select("name avatar type");
    if (!conversation || conversation.type !== "group") {
      throw new Error("INVALID_GROUP");
    }

    // Get invitees
    const invitees = await Promise.all(
      inviteeUids.map(uid => this.uidToUser(uid))
    );

    const results = [];

    for (const invitee of invitees) {
      try {
        // Check if already member
        const existingMember = await ConversationMember.findOne({
          conversation: conversationId,
          user: invitee._id,
          leftAt: null,
        });

        if (existingMember) {
          results.push({
            uid: invitee.uid,
            status: "already_member",
          });
          continue;
        }

        // Create notification with uniqueKey to prevent spam
        const uniqueKey = `invite_${invitee._id}_${conversationId}`;
        
        await GroupNotification.createNotification({
          recipient: invitee._id,
          conversation: conversationId,
          type: "GROUP_INVITE",
          actor: actor._id,
          uniqueKey,
          payload: {
            groupName: conversation.name,
            groupAvatar: conversation.avatar,
          },
        });

        // Emit event
        groupEmitter.emitInviteSent({
          actor: {
            uid: actor.uid,
            nickname: actor.nickname,
            avatar: actor.avatar,
          },
          invitee: {
            uid: invitee.uid,
          },
          conversation: {
            id: conversationId,
            name: conversation.name,
          },
        });

        results.push({
          uid: invitee.uid,
          status: "invited",
        });

      } catch (error) {
        results.push({
          uid: invitee.uid,
          status: "error",
          message: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Accept group invite
   */
  async acceptInvite(notificationId, userId) {
    const notification = await GroupNotification.findById(notificationId)
      .populate("conversation", "name avatar type")
      .populate("actor", "uid nickname avatar");

    if (!notification) {
      throw new Error("NOTIFICATION_NOT_FOUND");
    }

    if (notification.recipient.toString() !== userId.toString()) {
      throw new Error("UNAUTHORIZED");
    }

    if (notification.type !== "GROUP_INVITE") {
      throw new Error("INVALID_NOTIFICATION_TYPE");
    }

    // Check if already member
    const existingMember = await ConversationMember.findOne({
      conversation: notification.conversation._id,
      user: userId,
      leftAt: null,
    });

    if (existingMember) {
      throw new Error("ALREADY_MEMBER");
    }

    // Add to group
    await ConversationMember.create({
      conversation: notification.conversation._id,
      user: userId,
      role: "member",
    });

    // Delete invite notification
    await GroupNotification.findByIdAndDelete(notificationId);

    // Get user info
    const user = await User.findById(userId).select("uid nickname avatar");

    // Emit events
    groupEmitter.emitInviteAccepted({
      user: {
        uid: user.uid,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      conversation: {
        id: notification.conversation._id,
        name: notification.conversation.name,
      },
    });

    groupEmitter.emitMemberJoined({
      user: {
        uid: user.uid,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      conversation: {
        id: notification.conversation._id,
      },
    });

    return {
      conversationId: notification.conversation._id,
      conversation: notification.conversation,
    };
  }

  /**
   * Reject group invite
   */
  async rejectInvite(notificationId, userId) {
    const notification = await GroupNotification.findById(notificationId);

    if (!notification) {
      throw new Error("NOTIFICATION_NOT_FOUND");
    }

    if (notification.recipient.toString() !== userId.toString()) {
      throw new Error("UNAUTHORIZED");
    }

    if (notification.type !== "GROUP_INVITE") {
      throw new Error("INVALID_NOTIFICATION_TYPE");
    }

    // Delete notification
    await GroupNotification.findByIdAndDelete(notificationId);

    const user = await User.findById(userId).select("uid");

    groupEmitter.emitInviteRejected({
      user: {
        uid: user.uid,
      },
      conversationId: notification.conversation,
    });

    return { success: true };
  }
}

export default new GroupInvite();