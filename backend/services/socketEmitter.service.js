// backend/services/socketEmitter.service.js

class SocketEmitter {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    if (!io) {
      throw new Error('Socket.IO instance is required');
    }
    this.io = io;
    console.log('✅ [SocketEmitter] Socket.IO instance injected');
  }

  isIOAvailable() {
    if (!this.io || typeof this.io.to !== 'function') {
      console.warn('⚠️  [SocketEmitter] Socket.IO not available or not initialized properly');
      return false;
    }
    return true;
  }

  /**
   * 🔥 CRITICAL FIX: Emit using PUBLIC UID, not MongoDB _id
   * memberUpdates keys MUST be public UIDs
   */
  emitNewMessage(conversationId, message, memberUpdates) {
    if (!this.isIOAvailable()) return;

    if (!memberUpdates || Object.keys(memberUpdates).length === 0) {
      console.warn('⚠️  [SocketEmitter] No memberUpdates provided for message_received');
      return;
    }

    console.log(`📡 [SocketEmitter] Emitting message_received to ${Object.keys(memberUpdates).length} users`);
    
    // 🔥 CRITICAL: memberUpdates keys MUST be public UIDs (e.g. a0cf73f6-...)
    Object.entries(memberUpdates).forEach(([userUid, update]) => {
      try {
        // 🔥 Emit to user:{PUBLIC_UID}, NOT user:{MONGODB_ID}
        this.io.to(`user:${userUid}`).emit('message_received', {
          message: {
            messageId: message.messageId || message._id,
            conversation: message.conversation,
            content: message.content,
            type: message.type,
            sender: message.sender,
            createdAt: message.createdAt,
            editedAt: message.editedAt || null,
            replyTo: message.replyTo || null,
            attachments: message.attachments || [],
            clientMessageId: message.clientMessageId || null
          },
          conversationUpdate: {
            lastMessage: {
              messageId: message.messageId || message._id,
              content: message.content,
              sender: message.sender,
              createdAt: message.createdAt
            },
            unreadCount: update.unreadCount,
            lastSeenMessage: update.lastSeenMessage
          }
        });

        console.log(`   → user:${userUid} (unread: ${update.unreadCount})`);
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${userUid}:`, error.message);
      }
    });
  }

  /**
   * ✅ Message read receipt
   */
  emitMessageRead(conversationId, readByUserId, memberIds) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting message_read to ${memberIds.length} users`);
    
    memberIds.forEach(userId => {
      try {
        this.io.to(`user:${userId}`).emit('message_read', {
          conversationId,
          readBy: readByUserId,
          conversationUpdate: {
            unreadCount: userId === readByUserId ? 0 : undefined
          }
        });
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${userId}:`, error.message);
      }
    });
  }

  /**
   * ✅ Typing indicator
   */
  emitUserTyping(conversationId, data) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting user_typing to room: ${conversationId}`);
    
    try {
      this.io.to(conversationId).emit('user_typing', {
        conversationId,
        user: data.user,
        isTyping: data.isTyping
      });
    } catch (error) {
      console.error('❌ [SocketEmitter] Failed to emit user_typing:', error.message);
    }
  }

  /**
   * ✅ Message edited
   */
  emitMessageEdited(conversationId, message) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting message_edited to room: ${conversationId}`);
    
    try {
      this.io.to(conversationId).emit('message_edited', {
        conversationId,
        message: {
          messageId: message.messageId || message._id,
          content: message.content,
          editedAt: message.editedAt,
          sender: message.sender
        }
      });
    } catch (error) {
      console.error('❌ [SocketEmitter] Failed to emit message_edited:', error.message);
    }
  }

  /**
   * 🔥 Message deleted with per-user updates
   */
  emitMessageDeleted(conversationId, messageId, deletedBy, memberUpdates) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting message_deleted to ${Object.keys(memberUpdates || {}).length} users`);
    
    if (!memberUpdates || Object.keys(memberUpdates).length === 0) {
      try {
        this.io.to(conversationId).emit('message_deleted', {
          messageId,
          conversationId,
          deletedBy
        });
      } catch (error) {
        console.error('❌ [SocketEmitter] Failed to emit message_deleted:', error.message);
      }
      return;
    }

    Object.entries(memberUpdates).forEach(([userId, update]) => {
      try {
        this.io.to(`user:${userId}`).emit('message_deleted', {
          messageId,
          conversationId,
          deletedBy,
          conversationUpdate: update
        });
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${userId}:`, error.message);
      }
    });
  }

  /**
   * ✅ User online status
   */
  emitUserOnline(userIds, data) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting user_online to ${userIds.length} users`);
    
    userIds.forEach(uid => {
      try {
        this.io.to(`user:${uid}`).emit('user_online', {
          userId: data.userId,
          lastSeen: data.lastSeen
        });
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${uid}:`, error.message);
      }
    });
  }

  /**
   * ✅ User offline status
   */
  emitUserOffline(userIds, data) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting user_offline to ${userIds.length} users`);
    
    userIds.forEach(uid => {
      try {
        this.io.to(`user:${uid}`).emit('user_offline', {
          userId: data.userId,
          lastSeen: data.lastSeen
        });
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${uid}:`, error.message);
      }
    });
  }

  /**
   * ✅ Conversation metadata updated
   */
  emitConversationUpdated(conversationId, updates) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting conversation_updated to room: ${conversationId}`);
    
    try {
      this.io.to(conversationId).emit('conversation_updated', {
        conversationId,
        updates
      });
    } catch (error) {
      console.error('❌ [SocketEmitter] Failed to emit conversation_updated:', error.message);
    }
  }

  /**
   * ✅ Member added to group
   */
  emitMemberAdded(conversationId, newMembers) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting member_added to room: ${conversationId}`);
    
    try {
      this.io.to(conversationId).emit('member_added', {
        conversationId,
        members: newMembers
      });

      newMembers.forEach(member => {
        this.io.to(`user:${member.uid}`).emit('conversation_joined', {
          conversationId,
          conversation: member.conversationData
        });
      });
    } catch (error) {
      console.error('❌ [SocketEmitter] Failed to emit member_added:', error.message);
    }
  }

  /**
   * ✅ Member removed from group
   */
  emitMemberRemoved(conversationId, memberUid, removedBy) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] Emitting member_removed to room: ${conversationId}`);
    
    try {
      this.io.to(conversationId).emit('member_removed', {
        conversationId,
        memberUid,
        removedBy
      });

      this.io.to(`user:${memberUid}`).emit('conversation_left', {
        conversationId,
        reason: 'removed'
      });
    } catch (error) {
      console.error('❌ [SocketEmitter] Failed to emit member_removed:', error.message);
    }
  }

    /**
   * ✅ Generic emit to a single user (soft realtime)
   * Used for: user:update, profile/avatar changes, system events
   */
  emitToUser(uid, event, payload) {
    if (!this.isIOAvailable()) return;

    if (!uid || !event) {
      console.warn('⚠️ [SocketEmitter] emitToUser missing uid or event');
      return;
    }

    try {
      this.io.to(`user:${uid}`).emit(event, payload);
      console.log(`📡 [SocketEmitter] emitToUser → user:${uid} | event: ${event}`);
    } catch (error) {
      console.error(
        `❌ [SocketEmitter] emitToUser failed for user:${uid}:`,
        error.message
      );
    }
  }
  
  /**
   * ✅ Helper to get connected sockets for user
   */
  getUserSockets(userId) {
    if (!this.isIOAvailable()) return [];

    try {
      const roomName = `user:${userId}`;
      const room = this.io.sockets.adapter.rooms.get(roomName);
      return room ? Array.from(room) : [];
    } catch (error) {
      console.error('❌ [SocketEmitter] Failed to get user sockets:', error.message);
      return [];
    }
  }

  /**
   * ✅ Broadcast to all users except one
   */
  broadcastToUsersExcept(userIds, exceptUserId, eventName, data) {
    if (!this.isIOAvailable()) return;

    userIds.forEach(uid => {
      if (uid !== exceptUserId) {
        try {
          this.io.to(`user:${uid}`).emit(eventName, data);
        } catch (error) {
          console.error(`❌ [SocketEmitter] Failed to emit to user ${uid}:`, error.message);
        }
      }
    });
  }
}

// ✅ Export singleton instance
export default new SocketEmitter();