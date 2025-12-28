// backend/services/conversation/conversation.service.js
import ConversationQuery from './conversation.query.js';
import ConversationCreate from './conversation.create.js';
import ConversationRead from './conversation.read.js';
import ConversationMember from './conversation.member.js';

/**
 * Main Conversation Service - Orchestrator
 * Delegates to specific services for each domain
 */
class ConversationService {
  /**
   * Check if conversation exists with a friend
   */
  async checkConversation(userUid, friendUid) {
    return ConversationQuery.checkConversation(userUid, friendUid);
  }

  /**
   * Get user's conversations for sidebar
   */
  async getUserConversations(userUid, limit = 20, offset = 0) {
    return ConversationQuery.getUserConversations(userUid, limit, offset);
  }

  /**
   * Get conversation detail
   */
  async getConversationDetail(conversationId, userUid) {
    return ConversationQuery.getConversationDetail(conversationId, userUid);
  }

  /**
   * Create private conversation (1-1 chat)
   */
  async createPrivate(userUid, friendUid) {
    return ConversationCreate.createPrivate(userUid, friendUid);
  }

  /**
   * Create group conversation
   */
  async createGroup(userUid, name, memberUids) {
    return ConversationCreate.createGroup(userUid, name, memberUids);
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId, userUid) {
    return ConversationRead.markAsRead(conversationId, userUid);
  }

  /**
   * Leave group
   */
  async leaveGroup(conversationId, userUid) {
    return ConversationMember.leaveGroup(conversationId, userUid);
  }

  /**
   * Add members to group
   */
  async addMembers(conversationId, adminUid, memberUids) {
    return ConversationMember.addMembers(conversationId, adminUid, memberUids);
  }

  /**
   * Remove member from group
   */
  async removeMember(conversationId, adminUid, memberUid) {
    return ConversationMember.removeMember(conversationId, adminUid, memberUid);
  }
}

export default new ConversationService();