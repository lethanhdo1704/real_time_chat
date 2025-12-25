// backend/services/socketEmitter.service.js
class SocketEmitter {
  constructor(io) {
    if (!io) {
      throw new Error('Socket.IO instance is required');
    }
    this.io = io;
  }

  /**
   * 🔥 Emit new message with PER-USER conversation updates
   * 
   * @param {string} conversationId 
   * @param {object} message - The message object
   * @param {object} memberUpdates - Object with userId as key, updates as value
   * 
   * Example memberUpdates:
   * {
   *   'user123': { unreadCount: 0, lastSeenMessage: 'msg456' },
   *   'user456': { unreadCount: 5, lastSeenMessage: 'msg123' }
   * }
   */
  emitNewMessage(conversationId, message, memberUpdates) {
    if (!memberUpdates || Object.keys(memberUpdates).length === 0) {
      console.warn('⚠️  [SocketEmitter] No memberUpdates provided for message:new');
      return;
    }

    console.log(`📡 [SocketEmitter] Emitting message:new to ${Object.keys(memberUpdates).length} users`);
    
    // ✅ Emit to EACH user individually with THEIR data
    Object.entries(memberUpdates).forEach(([userId, update]) => {
      this.io.to(`user:${userId}`).emit('message:new', {
        conversationId,
        message: {
          messageId: message.messageId || message._id,
          content: message.content,
          type: message.type,
          sender: message.sender,
          createdAt: message.createdAt,
          editedAt: message.editedAt || null,
          replyTo: message.replyTo || null,
          attachments: message.attachments || []
        },
        conversationUpdate: {
          lastMessage: {
            messageId: message.messageId || message._id,
            content: message.content,
            sender: message.sender,
            createdAt: message.createdAt
          },
          unreadCount: update.unreadCount,           // ✅ Per-user value
          lastSeenMessage: update.lastSeenMessage    // ✅ Per-user value
        }
      });

      console.log(`   → user:${userId} (unread: ${update.unreadCount})`);
    });
  }

  /**
   * ✅ Emit message read receipt to ALL members
   * 
   * @param {string} conversationId 
   * @param {string} readByUserId - Who marked as read
   * @param {array} memberIds - All members who should be notified
   */
  emitMessageRead(conversationId, readByUserId, memberIds) {
    console.log(`📡 [SocketEmitter] Emitting message:read to ${memberIds.length} users`);
    
    // Notify ALL members (including reader for confirmation)
    memberIds.forEach(userId => {
      this.io.to(`user:${userId}`).emit('message:read', {
        conversationId,
        readBy: readByUserId,
        conversationUpdate: {
          unreadCount: userId === readByUserId ? 0 : undefined // Only reset for reader
        }
      });
    });
  }

  /**
   * ✅ Typing indicator
   * Emit to conversation room is OK here (no per-user data)
   */
  emitUserTyping(conversationId, data) {
    console.log(`📡 [SocketEmitter] Emitting user:typing to room: ${conversationId}`);
    
    // Broadcast to conversation room (excluding sender)
    this.io.to(conversationId).emit('user:typing', {
      conversationId,
      user: data.user,
      isTyping: data.isTyping
    });
  }

  /**
   * ✅ User online status
   */
  emitUserOnline(userIds, data) {
    console.log(`📡 [SocketEmitter] Emitting user:online to ${userIds.length} users`);
    
    userIds.forEach(uid => {
      this.io.to(`user:${uid}`).emit('user:online', {
        userId: data.userId,
        lastSeen: data.lastSeen
      });
    });
  }

  /**
   * ✅ User offline status
   */
  emitUserOffline(userIds, data) {
    console.log(`📡 [SocketEmitter] Emitting user:offline to ${userIds.length} users`);
    
    userIds.forEach(uid => {
      this.io.to(`user:${uid}`).emit('user:offline', {
        userId: data.userId,
        lastSeen: data.lastSeen
      });
    });
  }

  /**
   * ✅ Message edited
   * Emit to conversation room is OK (everyone sees same edit)
   */
  emitMessageEdited(conversationId, message) {
    console.log(`📡 [SocketEmitter] Emitting message:edited to room: ${conversationId}`);
    
    this.io.to(conversationId).emit('message:edited', {
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
   * 🔥 Message deleted with per-user updates
   * 
   * @param {string} conversationId 
   * @param {string} messageId 
   * @param {string} deletedBy 
   * @param {object} memberUpdates - Updated conversation state per user
   */
  emitMessageDeleted(conversationId, messageId, deletedBy, memberUpdates) {
    console.log(`📡 [SocketEmitter] Emitting message:deleted to ${Object.keys(memberUpdates).length} users`);
    
    // If no member updates, broadcast to room (message not last message)
    if (!memberUpdates || Object.keys(memberUpdates).length === 0) {
      this.io.to(conversationId).emit('message:deleted', {
        messageId,
        conversationId,
        deletedBy
      });
      return;
    }

    // If last message was deleted, emit per-user with updated state
    Object.entries(memberUpdates).forEach(([userId, update]) => {
      this.io.to(`user:${userId}`).emit('message:deleted', {
        messageId,
        conversationId,
        deletedBy,
        conversationUpdate: update  // May include new lastMessage
      });
    });
  }

  /**
   * ✅ Conversation metadata updated (name, avatar, etc)
   * Everyone sees same data - room emit is OK
   */
  emitConversationUpdated(conversationId, updates) {
    console.log(`📡 [SocketEmitter] Emitting conversation:updated to room: ${conversationId}`);
    
    this.io.to(conversationId).emit('conversation:updated', {
      conversationId,
      updates
    });
  }

  /**
   * ✅ Member added to group
   */
  emitMemberAdded(conversationId, newMembers) {
    console.log(`📡 [SocketEmitter] Emitting member:added to room: ${conversationId}`);
    
    this.io.to(conversationId).emit('member:added', {
      conversationId,
      members: newMembers
    });

    // Also notify new members directly
    newMembers.forEach(member => {
      this.io.to(`user:${member.uid}`).emit('conversation:joined', {
        conversationId,
        conversation: member.conversationData
      });
    });
  }

  /**
   * ✅ Member removed from group
   */
  emitMemberRemoved(conversationId, memberUid, removedBy) {
    console.log(`📡 [SocketEmitter] Emitting member:removed to room: ${conversationId}`);
    
    // Notify remaining members
    this.io.to(conversationId).emit('member:removed', {
      conversationId,
      memberUid,
      removedBy
    });

    // Notify removed member directly
    this.io.to(`user:${memberUid}`).emit('conversation:left', {
      conversationId,
      reason: 'removed'
    });
  }

  /**
   * ✅ Helper to get connected sockets for user (debugging)
   */
  getUserSockets(userId) {
    const roomName = `user:${userId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return room ? Array.from(room) : [];
  }

  /**
   * ✅ Broadcast to all users except one
   */
  broadcastToUsersExcept(userIds, exceptUserId, eventName, data) {
    userIds.forEach(uid => {
      if (uid !== exceptUserId) {
        this.io.to(`user:${uid}`).emit(eventName, data);
      }
    });
  }
}

export default SocketEmitter;