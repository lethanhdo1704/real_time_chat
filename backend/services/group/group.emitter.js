// backend/services/group/group.emitter.js
import { EventEmitter } from "events";

class GroupEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(30);
  }

  // Member events
  emitMemberJoined(data) {
    this.emit("group:member_joined", data);
  }

  emitMemberLeft(data) {
    this.emit("group:member_left", data);
  }

  emitMemberKicked(data) {
    this.emit("group:member_kicked", data);
  }

  // Role events
  emitRoleChanged(data) {
    this.emit("group:role_changed", data);
  }

  // Invite events
  emitInviteSent(data) {
    this.emit("group:invite_sent", data);
  }

  emitInviteAccepted(data) {
    this.emit("group:invite_accepted", data);
  }

  emitInviteRejected(data) {
    this.emit("group:invite_rejected", data);
  }

  // Join request events
  emitJoinRequest(data) {
    this.emit("group:join_request", data);
  }

  emitJoinApproved(data) {
    this.emit("group:join_approved", data);
  }

  emitJoinRejected(data) {
    this.emit("group:join_rejected", data);
  }

  // Group events
  emitGroupDeleted(data) {
    this.emit("group:deleted", data);
  }

  emitPermissionChanged(data) {
    this.emit("group:permission_changed", data);
  }

  emitJoinModeChanged(data) {
    const io = global.io;
    if (!io) return;

    io.to(`conversation_${data.conversationId}`).emit("group:joinModeChanged", {
      conversationId: data.conversationId,
      newJoinMode: data.newJoinMode,
    });

    console.log(
      `🔄 [GroupEmitter] Join mode changed to ${data.newJoinMode} for ${data.conversationId}`
    );
  }
}

const groupEmitter = new GroupEmitter();

export const GROUP_EVENTS = {
  MEMBER_JOINED: "group:member_joined",
  MEMBER_LEFT: "group:member_left",
  MEMBER_KICKED: "group:member_kicked",
  ROLE_CHANGED: "group:role_changed",
  INVITE_SENT: "group:invite_sent",
  INVITE_ACCEPTED: "group:invite_accepted",
  INVITE_REJECTED: "group:invite_rejected",
  JOIN_REQUEST: "group:join_request",
  JOIN_APPROVED: "group:join_approved",
  JOIN_REJECTED: "group:join_rejected",
  GROUP_DELETED: "group:deleted",
  PERMISSION_CHANGED: "group:permission_changed",
};

export default groupEmitter;
