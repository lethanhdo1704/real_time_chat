// frontend/src/services/chatApi.js
import api from "./api";

/**
 * Chat API Service
 * All REST API calls for conversations and messages
 */

// ============================================
// CONVERSATION ENDPOINTS
// ============================================

/**
 * Get all conversations for current user
 */
export const getUserConversations = async () => {
  const response = await api.get("/conversations");
  return response.data;
};

/**
 * Get single conversation by ID
 */
export const getConversationById = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}`);
  return response.data;
};

/**
 * Create private conversation with a friend
 */
export const createPrivateConversation = async (friendUid) => {
  const response = await api.post("/conversations", {
    type: "private",
    participantUid: friendUid,
  });
  return response.data;
};

/**
 * Create group conversation
 */
export const createGroupConversation = async (groupData) => {
  const response = await api.post("/conversations", {
    type: "group",
    ...groupData,
  });
  return response.data;
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (conversationId) => {
  const response = await api.post(`/conversations/${conversationId}/read`);
  return response.data;
};

// ============================================
// MESSAGE ENDPOINTS
// ============================================

/**
 * Get messages for a conversation (with pagination)
 */
export const getMessages = async (conversationId, params = {}) => {
  const { page = 1, limit = 50, before } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (before) {
    queryParams.append("before", before);
  }
  
  const response = await api.get(
    `/messages/${conversationId}?${queryParams.toString()}`
  );
  return response.data;
};

/**
 * Send new message
 */
export const sendMessage = async (messageData) => {
  const response = await api.post("/messages", messageData);
  return response.data;
};

/**
 * Edit existing message
 */
export const editMessage = async (messageId, newContent) => {
  const response = await api.put(`/messages/${messageId}`, {
    content: newContent,
  });
  return response.data;
};

/**
 * Delete message
 */
export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/messages/${messageId}`);
  return response.data;
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId) => {
  const response = await api.post(`/messages/${messageId}/read`);
  return response.data;
};

// ============================================
// SEARCH
// ============================================

/**
 * Search messages in conversation
 */
export const searchMessages = async (conversationId, query) => {
  const response = await api.get(
    `/messages/${conversationId}/search?q=${encodeURIComponent(query)}`
  );
  return response.data;
};

// ============================================
// DEFAULT EXPORT (nếu cần)
// ============================================
export default {
  getUserConversations,
  getConversationById,
  createPrivateConversation,
  createGroupConversation,
  markConversationAsRead,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  searchMessages,
};