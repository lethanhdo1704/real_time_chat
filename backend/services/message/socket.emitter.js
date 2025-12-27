// backend/services/message/socket.emitter.js

/**
 * Socket Emitter Wrapper
 * Handles all socket emissions for message events
 */
class SocketEmitter {
  constructor() {
    this.io = null;
  }

  /**
   * Set socket.io instance
   */
  setIO(io) {
    this.io = io;
    console.log("✅ Socket.IO instance set in SocketEmitter");
  }

  /**
   * Emit new message to conversation room
   */
  emitNewMessage(conversationId, message, memberUpdates) {
    if (!this.io) return;

    console.log(`📤 [Socket] Emitting new message to conversation: ${conversationId}`);

    // Emit to each member with their specific unread count
    Object.keys(memberUpdates).forEach((userId) => {
      this.io.to(`user:${userId}`).emit("message_received", {
        message,
        unreadCount: memberUpdates[userId].unreadCount,
        conversationId,
      });
    });
  }

  /**
   * Emit message read event
   */
  emitMessageRead(conversationId, readByUserId, memberIds) {
    if (!this.io) return;

    console.log(`👁️  [Socket] Emitting message_read for conversation: ${conversationId}`);

    // Emit to other members
    memberIds.forEach((memberId) => {
      if (memberId !== readByUserId) {
        this.io.to(`user:${memberId}`).emit("message_read", {
          conversationId,
          readBy: readByUserId,
          timestamp: new Date(),
        });
      }
    });
  }

  /**
   * Emit message edited event
   */
  emitMessageEdited(conversationId, message) {
    if (!this.io) return;

    console.log(`✏️  [Socket] Emitting message_edited for conversation: ${conversationId}`);

    this.io.to(conversationId).emit("message_edited", {
      message,
      conversationId,
    });
  }

  /**
   * Emit message deleted event
   */
  emitMessageDeleted(conversationId, messageId, deletedBy, memberUpdates) {
    if (!this.io) return;

    console.log(`🗑️  [Socket] Emitting message_deleted for conversation: ${conversationId}`);

    // If memberUpdates exist (lastMessage changed)
    if (Object.keys(memberUpdates).length > 0) {
      Object.keys(memberUpdates).forEach((userId) => {
        this.io.to(`user:${userId}`).emit("message_deleted", {
          conversationId,
          messageId,
          deletedBy,
          ...memberUpdates[userId], // lastMessage, unreadCount
        });
      });
    } else {
      // Simple deletion without lastMessage change
      this.io.to(conversationId).emit("message_deleted", {
        conversationId,
        messageId,
        deletedBy,
      });
    }
  }

  /**
   * Emit conversation created (for new conversations)
   */
  emitConversationCreated(conversation, memberIds) {
    if (!this.io) return;

    console.log(`🆕 [Socket] Emitting conversation_created: ${conversation.id}`);

    memberIds.forEach((memberId) => {
      this.io.to(`user:${memberId}`).emit("conversation_created", {
        conversation,
      });
    });
  }
}

export default new SocketEmitter();