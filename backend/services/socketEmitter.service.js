// backend/services/socketEmitter.service.js
/**
 * Socket Emitter Service
 * Centralized service for emitting socket events
 * This separates socket logic from HTTP controllers
 */

class SocketEmitter {
  constructor(io) {
    this.io = io;
  }

  /**
   * Emit new message to conversation room
   * @param {string} conversationId 
   * @param {object} message 
   */
  emitMessageReceived(conversationId, message) {
    console.log(`📡 [SocketEmitter] Emitting message_received to room: ${conversationId}`);
    
    this.io.to(conversationId).emit('message_received', {
      message
    });
  }

  /**
   * Emit message read receipt to conversation room
   * @param {string} conversationId 
   * @param {object} data 
   */
  emitMessageRead(conversationId, data) {
    console.log(`📡 [SocketEmitter] Emitting message_read to room: ${conversationId}`);
    
    this.io.to(conversationId).emit('message_read', data);
  }

  /**
   * Emit user typing status to conversation room
   * @param {string} conversationId 
   * @param {object} data 
   */
  emitUserTyping(conversationId, data) {
    this.io.to(conversationId).emit('user_typing', data);
  }

  /**
   * Emit user online status to specific user rooms
   * @param {array} userIds - Array of user UIDs
   * @param {object} data 
   */
  emitUserOnline(userIds, data) {
    userIds.forEach(uid => {
      this.io.to(`user:${uid}`).emit('user_online', data);
    });
  }

  /**
   * Emit user offline status to specific user rooms
   * @param {array} userIds - Array of user UIDs
   * @param {object} data 
   */
  emitUserOffline(userIds, data) {
    userIds.forEach(uid => {
      this.io.to(`user:${uid}`).emit('user_offline', data);
    });
  }

  /**
   * Emit message edited event
   * @param {string} conversationId 
   * @param {object} message 
   */
  emitMessageEdited(conversationId, message) {
    console.log(`📡 [SocketEmitter] Emitting message_edited to room: ${conversationId}`);
    
    this.io.to(conversationId).emit('message_edited', {
      message
    });
  }

  /**
   * Emit message deleted event
   * @param {string} conversationId 
   * @param {string} messageId 
   * @param {string} deletedBy 
   */
  emitMessageDeleted(conversationId, messageId, deletedBy) {
    console.log(`📡 [SocketEmitter] Emitting message_deleted to room: ${conversationId}`);
    
    this.io.to(conversationId).emit('message_deleted', {
      messageId,
      conversationId,
      deletedBy
    });
  }

  /**
   * Emit conversation updated event (name, avatar changed)
   * @param {string} conversationId 
   * @param {object} updates 
   */
  emitConversationUpdated(conversationId, updates) {
    this.io.to(conversationId).emit('conversation_updated', {
      conversationId,
      updates
    });
  }

  /**
   * Emit member added to group
   * @param {string} conversationId 
   * @param {array} newMembers 
   */
  emitMemberAdded(conversationId, newMembers) {
    this.io.to(conversationId).emit('member_added', {
      conversationId,
      members: newMembers
    });
  }

  /**
   * Emit member removed from group
   * @param {string} conversationId 
   * @param {string} memberUid 
   */
  emitMemberRemoved(conversationId, memberUid) {
    this.io.to(conversationId).emit('member_removed', {
      conversationId,
      memberUid
    });
  }
}

export default SocketEmitter;