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
   * 🔥 HELPER: Get standardized room name
   */
  getConversationRoom(conversationId) {
    return `conversation:${conversationId}`;
  }

  getUserRoom(uid) {
    return `user:${uid}`;
  }

  /**
   * ============================================
   * MESSAGE EVENTS (CONVERSATION-BASED)
   * ============================================
   */

  /**
   * 🔥 FIXED: Emit to CONVERSATION ROOM, not individual users
   * This ensures ALL message events are consistent
   */
  emitNewMessage(conversationId, message, memberUpdates) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message_received → ${room}`);

    // 🔥 CRITICAL FIX: Emit to conversation room, not user rooms
    this.io.to(room).emit('message_received', {
      conversationId,
      message: {
        messageId: message.messageId || message._id,
        conversation: message.conversation || conversationId,
        content: message.content,
        type: message.type,
        sender: message.sender,
        createdAt: message.createdAt,
        editedAt: message.editedAt || null,
        replyTo: message.replyTo || null,
        attachments: message.attachments || [],
        clientMessageId: message.clientMessageId || null
      }
    });

    // 🔥 SEPARATE: Emit unread counts to individual users
    // This keeps user-specific data separate from conversation events
    if (memberUpdates && Object.keys(memberUpdates).length > 0) {
      console.log(`📡 [SocketEmitter] Emitting unread updates to ${Object.keys(memberUpdates).length} users`);
      
      Object.entries(memberUpdates).forEach(([userUid, update]) => {
        try {
          this.io.to(this.getUserRoom(userUid)).emit('conversation_update', {
            conversationId,
            lastMessage: {
              messageId: message.messageId || message._id,
              content: message.content,
              sender: message.sender,
              createdAt: message.createdAt
            },
            lastMessageAt: message.createdAt,
            unreadCount: update.unreadCount,
            lastSeenMessage: update.lastSeenMessage
          });
        } catch (error) {
          console.error(`❌ [SocketEmitter] Failed to emit unread to user ${userUid}:`, error.message);
        }
      });
    }
  }

  /**
   * ✅ Message recalled - CONVERSATION ROOM
   */
  emitMessageRecalled(conversationId, messageId, recalledBy) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message_recalled → ${room}`);

    this.io.to(room).emit('message_recalled', {
      conversationId,
      messageId,
      recalledBy,
      recalledAt: new Date()
    });
  }

  /**
   * 🔥 FIXED: Message deleted - CONVERSATION ROOM
   * Admin delete affects everyone, so emit to conversation
   */
  emitMessageDeleted(conversationId, messageId, deletedBy, memberUpdates) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message_deleted → ${room}`);

    // Emit deletion to conversation room
    this.io.to(room).emit('message_deleted', {
      conversationId,
      messageId,
      deletedBy
    });

    // Separately emit lastMessage updates to individual users if needed
    if (memberUpdates && Object.keys(memberUpdates).length > 0) {
      console.log(`📡 [SocketEmitter] Emitting lastMessage updates to ${Object.keys(memberUpdates).length} users`);
      
      Object.entries(memberUpdates).forEach(([userId, update]) => {
        try {
          this.io.to(this.getUserRoom(userId)).emit('conversation_update', {
            conversationId,
            lastMessage: update.lastMessage,
            unreadCount: update.unreadCount
          });
        } catch (error) {
          console.error(`❌ [SocketEmitter] Failed to emit lastMessage to user ${userId}:`, error.message);
        }
      });
    }
  }

  /**
   * ✅ Message edited - CONVERSATION ROOM
   */
  emitMessageEdited(conversationId, message) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message_edited → ${room}`);

    this.io.to(room).emit('message_edited', {
      conversationId,
      message: {
        messageId: message.messageId || message._id,
        content: message.content,
        editedAt: message.editedAt,
        sender: message.sender
      }
    });
  }

  /**
   * ✅ Typing indicator - CONVERSATION ROOM
   */
  emitUserTyping(conversationId, data) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] user_typing → ${room}`);

    this.io.to(room).emit('user_typing', {
      conversationId,
      user: data.user,
      isTyping: data.isTyping
    });
  }

  /**
   * ✅ Conversation metadata updated - CONVERSATION ROOM
   */
  emitConversationUpdated(conversationId, updates) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] conversation_updated → ${room}`);

    this.io.to(room).emit('conversation_updated', {
      conversationId,
      updates
    });
  }

  /**
   * ============================================
   * USER-SPECIFIC EVENTS (USER ROOM)
   * ============================================
   */

  /**
   * ✅ Message read receipt - USER ROOM
   * Each user needs their own unread count update
   */
  emitMessageRead(conversationId, readByUserId, memberIds) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] message_read to ${memberIds.length} users`);

    memberIds.forEach(userId => {
      try {
        if (userId !== readByUserId) {
          this.io.to(this.getUserRoom(userId)).emit('message_read', {
            conversationId,
            readBy: readByUserId,
            timestamp: new Date(),
            conversationUpdate: {
              unreadCount: userId === readByUserId ? 0 : undefined
            }
          });
        }
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${userId}:`, error.message);
      }
    });
  }

  /**
   * ✅ User online status - USER ROOM
   */
  emitUserOnline(userIds, data) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] user_online to ${userIds.length} users`);

    userIds.forEach(uid => {
      try {
        this.io.to(this.getUserRoom(uid)).emit('user_online', {
          userId: data.userId,
          lastSeen: data.lastSeen
        });
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${uid}:`, error.message);
      }
    });
  }

  /**
   * ✅ User offline status - USER ROOM
   */
  emitUserOffline(userIds, data) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] user_offline to ${userIds.length} users`);

    userIds.forEach(uid => {
      try {
        this.io.to(this.getUserRoom(uid)).emit('user_offline', {
          userId: data.userId,
          lastSeen: data.lastSeen
        });
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${uid}:`, error.message);
      }
    });
  }

  /**
   * 🆕 Conversation created - USER ROOM
   * New conversations are user-specific notifications
   */
  emitConversationCreated(conversation, memberIds) {
    if (!this.isIOAvailable()) return;

    console.log(`📡 [SocketEmitter] conversation_created to ${memberIds.length} users`);

    memberIds.forEach(memberId => {
      try {
        this.io.to(this.getUserRoom(memberId)).emit('conversation_created', {
          conversation
        });
      } catch (error) {
        console.error(`❌ [SocketEmitter] Failed to emit to user ${memberId}:`, error.message);
      }
    });
  }

  /**
   * ✅ Member added to group - CONVERSATION ROOM + USER NOTIFICATION
   */
  emitMemberAdded(conversationId, newMembers) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] member_added → ${room}`);

    this.io.to(room).emit('member_added', {
      conversationId,
      members: newMembers
    });

    // Notify each new member individually
    newMembers.forEach(member => {
      this.io.to(this.getUserRoom(member.uid)).emit('conversation_joined', {
        conversationId,
        conversation: member.conversationData
      });
    });
  }

  /**
   * ✅ Member removed from group - CONVERSATION ROOM + USER NOTIFICATION
   */
  emitMemberRemoved(conversationId, memberUid, removedBy) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] member_removed → ${room}`);

    this.io.to(room).emit('member_removed', {
      conversationId,
      memberUid,
      removedBy
    });

    this.io.to(this.getUserRoom(memberUid)).emit('conversation_left', {
      conversationId,
      reason: 'removed'
    });
  }

  /**
   * ✅ Generic emit to a single user
   */
  emitToUser(uid, event, payload) {
    if (!this.isIOAvailable()) return;

    if (!uid || !event) {
      console.warn('⚠️  [SocketEmitter] emitToUser missing uid or event');
      return;
    }

    try {
      this.io.to(this.getUserRoom(uid)).emit(event, payload);
      console.log(`📡 [SocketEmitter] ${event} → ${this.getUserRoom(uid)}`);
    } catch (error) {
      console.error(`❌ [SocketEmitter] emitToUser failed:`, error.message);
    }
  }

  /**
   * ✅ Helper to get connected sockets for user
   */
  getUserSockets(userId) {
    if (!this.isIOAvailable()) return [];

    try {
      const roomName = this.getUserRoom(userId);
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
          this.io.to(this.getUserRoom(uid)).emit(eventName, data);
        } catch (error) {
          console.error(`❌ [SocketEmitter] Failed to emit to user ${uid}:`, error.message);
        }
      }
    });
  }
}

// ✅ Export singleton instance
export default new SocketEmitter();