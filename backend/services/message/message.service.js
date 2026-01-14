// backend/services/message/message.service.js
/**
 * ============================================
 * MESSAGE SERVICE - FACADE PATTERN
 * ============================================
 */

import { sendMessage } from "./usecases/sendMessage.js";
import { getMessages } from "./usecases/getMessages.js";
import { markAsRead } from "./usecases/markAsRead.js";
import { getLastMessages } from "./usecases/getLastMessages.js";
import { editMessage } from "./usecases/editMessage.js";
import { hideMessage } from "./usecases/hideMessage.js";
import { deleteForMe } from "./usecases/deleteForMe.js";
import { recallMessage } from "./usecases/recallMessage.js";
import { adminDeleteMessage } from "./usecases/adminDeleteMessage.js";
import { toggleReaction } from "./usecases/toggleReaction.js";
import { getConversationMedia } from "./usecases/getConversationMedia.js";

class MessageService {
  /**
   * 🔥 SEND MESSAGE
   */
  async sendMessage(params) {
    return sendMessage(params);
  }

  /**
   * 🔥 GET MESSAGES (PAGINATION)
   */
  async getMessages(conversationId, userId, options) {
    return getMessages(conversationId, userId, options);
  }

  /**
   * 🔥 NEW: GET CONVERSATION MEDIA
   * Optimized for Conversation Info tabs
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @param {Object} options - { mediaType, before, limit }
   * @returns {Promise<Object>} { items, hasMore, oldestItemId }
   */
  async getConversationMedia(conversationId, userId, options) {
    return getConversationMedia(conversationId, userId, options);
  }

  /**
   * 🔥 MARK AS READ
   */
  async markAsRead(conversationId, userId) {
    return markAsRead(conversationId, userId);
  }

  /**
   * 🔥 GET LAST MESSAGES (SIDEBAR)
   */
  async getLastMessages(conversationIds, userId) {
    return getLastMessages(conversationIds, userId);
  }

  /**
   * 🔥 EDIT MESSAGE
   */
  async editMessage(messageId, userId, newContent) {
    return editMessage(messageId, userId, newContent);
  }

  /**
   * 🆕 KIỂU 1: HIDE MESSAGE
   */
  async hideMessage(messageId, userId) {
    return hideMessage(messageId, userId);
  }

  /**
   * 🆕 KIỂU 2: DELETE FOR ME
   */
  async deleteForMe(messageId, userId) {
    return deleteForMe(messageId, userId);
  }

  /**
   * 🆕 KIỂU 3: RECALL MESSAGE
   */
  async recallMessage(messageId, userId) {
    return recallMessage(messageId, userId);
  }

  /**
   * 🔧 PRIORITY 1: ADMIN DELETE
   */
  async adminDeleteMessage(messageId, adminId) {
    return adminDeleteMessage(messageId, adminId);
  }

  /**
   * 🎭 TOGGLE REACTION
   * Add or remove reaction (emoji) from message
   * 
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID (MongoDB _id)
   * @param {string} emoji - Unicode emoji
   * @returns {Promise<object>} { reactions, conversationId }
   */
  async toggleReaction(messageId, userId, emoji) {
    return toggleReaction(messageId, userId, emoji);
  }

  /**
   * 🔧 DEPRECATED: Keep for backward compatibility
   */
  async deleteMessage(messageId, userId) {
    console.warn("⚠️ [MessageService] deleteMessage is deprecated, use adminDeleteMessage");
    return this.adminDeleteMessage(messageId, userId);
  }
}

export default new MessageService();