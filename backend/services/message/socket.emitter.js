// backend/services/message/socket.emitter.js

class SocketEmitter {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
    console.log("✅ Socket.IO instance set in SocketEmitter");
  }

  /**
   * Emit new message with proper structure
   */
  emitNewMessage(conversationId, message, memberUpdates) {
    if (!this.io) return;

    console.log(`📤 [Socket] Emitting new message to conversation: ${conversationId}`);

    // Emit to each member with their specific unread count
    Object.keys(memberUpdates).forEach((userId) => {
      const updateData = {
        conversationId,
        message: {
          ...message,
          conversation: conversationId
        },
        conversationUpdate: {
          conversationId,
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            sender: message.sender
          },
          lastMessageAt: message.createdAt,
          unreadCount: memberUpdates[userId].unreadCount
        }
      };

      console.log(`📤 [Socket] Emitting to user:${userId}:`, {
        conversationId: updateData.conversationId,
        hasMessage: !!updateData.message,
        hasUpdate: !!updateData.conversationUpdate
      });

      this.io.to(`user:${userId}`).emit("message_received", updateData);
    });
  }

  /**
   * Emit message read with proper structure
   */
  emitMessageRead(conversationId, readByUserId, memberIds) {
    if (!this.io) return;

    console.log(`👁️  [Socket] Emitting message_read for conversation: ${conversationId}`);

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
   * Emit message edited with conversationId
   */
  emitMessageEdited(conversationId, message) {
    if (!this.io) return;

    console.log(`✏️  [Socket] Emitting message_edited for conversation: ${conversationId}`);

    this.io.to(conversationId).emit("message_edited", {
      conversationId,
      message,
    });
  }

  /**
   * 🆕 Emit message recalled (KIỂU 3: Thu hồi)
   * Broadcasts to all conversation members
   */
  emitMessageRecalled(conversationId, messageId, recalledBy) {
    if (!this.io) return;

    console.log(`↩️  [Socket] Emitting message_recalled for conversation: ${conversationId}`);

    this.io.to(conversationId).emit("message_recalled", {
      conversationId,
      messageId,
      recalledBy,
      recalledAt: new Date(),
    });
  }

  /**
   * Emit message deleted with proper structure
   * This is for admin delete (PRIORITY 1)
   */
  emitMessageDeleted(conversationId, messageId, deletedBy, memberUpdates) {
    if (!this.io) return;

    console.log(`🗑️  [Socket] Emitting message_deleted for conversation: ${conversationId}`);

    if (Object.keys(memberUpdates).length > 0) {
      Object.keys(memberUpdates).forEach((userId) => {
        this.io.to(`user:${userId}`).emit("message_deleted", {
          conversationId,
          messageId,
          deletedBy,
          conversationUpdate: {
            conversationId,
            lastMessage: memberUpdates[userId].lastMessage,
            unreadCount: memberUpdates[userId].unreadCount
          }
        });
      });
    } else {
      this.io.to(conversationId).emit("message_deleted", {
        conversationId,
        messageId,
        deletedBy,
      });
    }
  }

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