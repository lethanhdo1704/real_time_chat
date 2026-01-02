// backend/services/message/message.service.js
/**
 * ============================================
 * MESSAGE SERVICE - FACADE PATTERN
 * ============================================
 * 
 * This service acts as a facade, delegating to use cases.
 * Each use case encapsulates a single business operation.
 * 
 * Benefits:
 * - Clean separation of concerns
 * - Easy to test individual use cases
 * - Better code organization
 * - Single responsibility principle
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

class MessageService {
  /**
   * 🔥 SEND MESSAGE
   * Delegate to sendMessage use case
   */
  async sendMessage(params) {
    return sendMessage(params);
  }

  /**
   * 🔥 GET MESSAGES (PAGINATION)
   * Delegate to getMessages use case
   */
  async getMessages(conversationId, userId, options) {
    return getMessages(conversationId, userId, options);
  }

  /**
   * 🔥 MARK AS READ
   * Delegate to markAsRead use case
   */
  async markAsRead(conversationId, userId) {
    return markAsRead(conversationId, userId);
  }

  /**
   * 🔥 GET LAST MESSAGES (SIDEBAR)
   * Delegate to getLastMessages use case
   */
  async getLastMessages(conversationIds, userId) {
    return getLastMessages(conversationIds, userId);
  }

  /**
   * 🔥 EDIT MESSAGE
   * Delegate to editMessage use case
   */
  async editMessage(messageId, userId, newContent) {
    return editMessage(messageId, userId, newContent);
  }

  /**
   * 🆕 KIỂU 1: HIDE MESSAGE
   * Delegate to hideMessage use case
   */
  async hideMessage(messageId, userId) {
    return hideMessage(messageId, userId);
  }

  /**
   * 🆕 KIỂU 2: DELETE FOR ME
   * Delegate to deleteForMe use case
   */
  async deleteForMe(messageId, userId) {
    return deleteForMe(messageId, userId);
  }

  /**
   * 🆕 KIỂU 3: RECALL MESSAGE
   * Delegate to recallMessage use case
   */
  async recallMessage(messageId, userId) {
    return recallMessage(messageId, userId);
  }

  /**
   * 🔧 PRIORITY 1: ADMIN DELETE
   * Delegate to adminDeleteMessage use case
   */
  async adminDeleteMessage(messageId, adminId) {
    return adminDeleteMessage(messageId, adminId);
  }

  /**
   * 🔧 DEPRECATED: Keep for backward compatibility
   * Redirects to adminDeleteMessage
   */
  async deleteMessage(messageId, userId) {
    console.warn("⚠️ [MessageService] deleteMessage is deprecated, use adminDeleteMessage");
    return this.adminDeleteMessage(messageId, userId);
  }
}

export default new MessageService();