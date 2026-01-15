// backend/socket/group.socket.js
import groupEmitter, { GROUP_EVENTS } from "../services/group/group.emitter.js";

/**
 * Setup Group Socket Handlers
 * Listen to group events and emit realtime to clients
 */
export default function setupGroupSocket(io) {
  console.log("👥 Setting up Group socket handlers...");

  const getConversationRoom = (conversationId) => `conversation:${conversationId}`;
  const getUserRoom = (uid) => `user:${uid}`;

  // ============================================
  // MEMBER EVENTS
  // ============================================

  groupEmitter.on(GROUP_EVENTS.MEMBER_JOINED, async (data) => {
    console.log(`[GROUP] ${data.user.uid} joined ${data.conversation.id}`);

    // Emit to entire group
    const room = getConversationRoom(data.conversation.id.toString());
    io.to(room).emit("group:member_joined", {
      user: data.user,
      conversationId: data.conversation.id,
      viaLink: data.viaLink || false,
      timestamp: new Date(),
    });

    // Also emit to the new member's personal room
    io.to(getUserRoom(data.user.uid)).emit("group:joined", {
      conversationId: data.conversation.id,
      timestamp: new Date(),
    });
  });

  groupEmitter.on(GROUP_EVENTS.MEMBER_LEFT, (data) => {
    console.log(`[GROUP] ${data.user.uid} left ${data.conversationId}`);

    const room = getConversationRoom(data.conversationId.toString());
    io.to(room).emit("group:member_left", {
      user: data.user,
      conversationId: data.conversationId,
      timestamp: new Date(),
    });
  });

  groupEmitter.on(GROUP_EVENTS.MEMBER_KICKED, (data) => {
    console.log(`[GROUP] ${data.target.uid} kicked by ${data.actor.uid}`);

    const room = getConversationRoom(data.conversationId.toString());

    // Emit to group
    io.to(room).emit("group:member_kicked", {
      actor: data.actor,
      target: data.target,
      conversationId: data.conversationId,
      timestamp: new Date(),
    });

    // Emit to kicked user
    io.to(getUserRoom(data.target.uid)).emit("group:kicked", {
      actor: data.actor,
      conversationId: data.conversationId,
      timestamp: new Date(),
    });
  });

  // ============================================
  // ROLE EVENTS
  // ============================================

  groupEmitter.on(GROUP_EVENTS.ROLE_CHANGED, (data) => {
    console.log(`[GROUP] ${data.target.uid} role → ${data.newRole}`);

    const room = getConversationRoom(data.conversationId.toString());
    io.to(room).emit("group:role_changed", {
      actor: data.actor,
      target: data.target,
      conversationId: data.conversationId,
      newRole: data.newRole,
      timestamp: new Date(),
    });
  });

  // ============================================
  // INVITE EVENTS
  // ============================================

  groupEmitter.on(GROUP_EVENTS.INVITE_SENT, (data) => {
    console.log(`[GROUP] Invite sent to ${data.invitee.uid}`);

    // Emit to invitee
    io.to(getUserRoom(data.invitee.uid)).emit("group:invite_received", {
      actor: data.actor,
      conversation: data.conversation,
      timestamp: new Date(),
    });
  });

  groupEmitter.on(GROUP_EVENTS.INVITE_ACCEPTED, (data) => {
    console.log(`[GROUP] ${data.user.uid} accepted invite`);

    // Emit to group
    const room = getConversationRoom(data.conversation.id.toString());
    io.to(room).emit("group:invite_accepted", {
      user: data.user,
      conversationId: data.conversation.id,
      timestamp: new Date(),
    });
  });

  groupEmitter.on(GROUP_EVENTS.INVITE_REJECTED, (data) => {
    console.log(`[GROUP] ${data.user.uid} rejected invite`);
    // No need to emit - just log
  });

  // ============================================
  // JOIN REQUEST EVENTS
  // ============================================

  groupEmitter.on(GROUP_EVENTS.JOIN_REQUEST, async (data) => {
    console.log(`[GROUP] Join request from ${data.user.uid}`);

    // Emit to all admins
    for (const adminUid of data.adminUids) {
      io.to(getUserRoom(adminUid)).emit("group:join_request_received", {
        user: data.user,
        conversation: data.conversation,
        timestamp: new Date(),
      });
    }
  });

  groupEmitter.on(GROUP_EVENTS.JOIN_APPROVED, (data) => {
    console.log(`[GROUP] Join approved for ${data.requester.uid}`);

    // Emit to requester
    io.to(getUserRoom(data.requester.uid)).emit("group:join_approved", {
      approver: data.approver,
      conversation: data.conversation,
      timestamp: new Date(),
    });

    // Emit to group (member joined)
    const room = getConversationRoom(data.conversation.id.toString());
    io.to(room).emit("group:member_joined", {
      user: data.requester,
      conversationId: data.conversation.id,
      timestamp: new Date(),
    });
  });

  groupEmitter.on(GROUP_EVENTS.JOIN_REJECTED, (data) => {
    console.log(`[GROUP] Join rejected for ${data.requester.uid}`);

    // Emit to requester
    io.to(getUserRoom(data.requester.uid)).emit("group:join_rejected", {
      rejecter: data.rejecter,
      conversationId: data.conversationId,
      timestamp: new Date(),
    });
  });

  // ============================================
  // GROUP MANAGEMENT EVENTS
  // ============================================

  groupEmitter.on(GROUP_EVENTS.GROUP_DELETED, (data) => {
    console.log(`[GROUP] Group deleted: ${data.conversationId}`);

    const room = getConversationRoom(data.conversationId.toString());
    io.to(room).emit("group:deleted", {
      conversationId: data.conversationId,
      timestamp: new Date(),
    });
  });

  groupEmitter.on(GROUP_EVENTS.PERMISSION_CHANGED, (data) => {
    console.log(`[GROUP] Permission changed: ${data.conversationId}`);

    const room = getConversationRoom(data.conversationId.toString());
    io.to(room).emit("group:permission_changed", {
      conversationId: data.conversationId,
      newPermission: data.newPermission,
      timestamp: new Date(),
    });
  });

  console.log("✅ Group socket handlers ready");
}