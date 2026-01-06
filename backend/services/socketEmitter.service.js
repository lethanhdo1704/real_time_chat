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

  emitNewMessage(conversationId, message, memberUpdates) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message_received → ${room}`);

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
        reactions: message.reactions || [],
        clientMessageId: message.clientMessageId || null
      }
    });

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
   * 🆕 REACTION UPDATE - CONVERSATION ROOM
   * Broadcasts reaction changes to all conversation members
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {Array} reactions - Full reactions array with populated users
   */
  emitReactionUpdate(conversationId, messageId, reactions) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message:reaction:update → ${room}`);
    console.log(`  ↳ MessageId: ${messageId}, Reactions: ${reactions.length}`);

    // Format reactions for frontend
    const formattedReactions = reactions.map(r => ({
      user: {
        _id: r.user._id,
        uid: r.user.uid,
        nickname: r.user.nickname,
        avatar: r.user.avatar
      },
      emoji: r.emoji,
      createdAt: r.createdAt
    }));

    this.io.to(room).emit('message:reaction:update', {
      conversationId,
      messageId,
      reactions: formattedReactions,
      timestamp: new Date()
    });
  }

  /**
   * 🆕 READ RECEIPT - CONVERSATION ROOM
   */
  emitReadReceipt(conversationId, userUid, lastSeenMessageId) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message_read_receipt → ${room}`);
    console.log(`  ↳ User: ${userUid}, LastSeenMessage: ${lastSeenMessageId}`);

    this.io.to(room).emit('message_read_receipt', {
      conversationId,
      userUid,
      lastSeenMessageId,
      timestamp: new Date()
    });
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
   */
  emitMessageDeleted(conversationId, messageId, deletedBy, memberUpdates) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message_deleted → ${room}`);

    this.io.to(room).emit('message_deleted', {
      conversationId,
      messageId,
      deletedBy
    });

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
   * ✅ IMPROVED: Message edited - CONVERSATION ROOM
   */
  emitMessageEdited(conversationId, message) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] message_edited → ${room}`);
    console.log(`  ↳ MessageId: ${message.messageId || message._id}`);
    console.log(`  ↳ EditedAt: ${message.editedAt}`);

    this.io.to(room).emit('message_edited', {
      conversationId,
      message: {
        messageId: message.messageId || message._id,
        content: message.content,
        editedAt: message.editedAt,
        sender: message.sender,
        type: message.type || 'text',
        replyTo: message.replyTo || null,
        attachments: message.attachments || [],
        reactions: message.reactions || [],
        createdAt: message.createdAt,
        isRecalled: message.isRecalled || false,
        isDeleted: message.isDeleted || false
      },
      timestamp: new Date()
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

  emitMemberAdded(conversationId, newMembers) {
    if (!this.isIOAvailable()) return;

    const room = this.getConversationRoom(conversationId);

    console.log(`📡 [SocketEmitter] member_added → ${room}`);

    this.io.to(room).emit('member_added', {
      conversationId,
      members: newMembers
    });

    newMembers.forEach(member => {
      this.io.to(this.getUserRoom(member.uid)).emit('conversation_joined', {
        conversationId,
        conversation: member.conversationData
      });
    });
  }

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

export default new SocketEmitter();