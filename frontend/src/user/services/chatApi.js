// frontend/src/services/chatApi.js
import api from "./api";

/**
 * Chat API Service
 * All REST API calls for conversations and messages
 */

// ============================================
// HELPER FUNCTION
// ============================================

/**
 * Unwrap API response
 * Backend format: { success: true, data: {...} }
 * @param {Object} response - Axios response object
 * @returns {*} Unwrapped data
 */
const unwrapResponse = (response) => {
  return response.data.data || response.data;
};

// ============================================
// CONVERSATION ENDPOINTS
// ============================================

/**
 * 🔥 NEW: Check if conversation exists with a friend
 * Used when user clicks friend in FriendList
 * 
 * @param {string} friendId - Friend's uid
 * @returns {Promise<{exists: boolean, conversationId: string|null}>}
 */
export const checkConversation = async (friendId) => {
  const response = await api.get(`/conversations/check/${friendId}`);
  return unwrapResponse(response); // { exists, conversationId }
};

/**
 * Get all conversations for current user
 * @returns {Promise<Array>} Array of conversations
 */
export const getUserConversations = async () => {
  const response = await api.get("/conversations");
  const data = unwrapResponse(response); // { conversations: [...] }
  return data.conversations || []; // ✅ Trả về mảng trực tiếp
};

/**
 * Get single conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Conversation object
 */
export const getConversationById = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}`);
  return unwrapResponse(response);
};

/**
 * 🔥 NEW: Get conversation info with counters
 * Used for Conversation Info modal
 * 
 * Backend response:
 * {
 *   id, type, name, avatar, createdAt,
 *   statistics: {
 *     totalMessages,
 *     shared: { images, videos, audios, files, links }
 *   }
 * }
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Conversation info with counters
 */
export const getConversationInfo = async (conversationId) => {
  console.log('📊 [chatApi] getConversationInfo:', conversationId);
  
  const response = await api.get(`/conversations/${conversationId}/info`);
  const data = unwrapResponse(response);
  
  console.log('✅ [chatApi] Conversation info received:', {
    totalMessages: data.statistics?.totalMessages,
    sharedImages: data.statistics?.shared?.images,
  });
  
  return data;
};

/**
 * Create private conversation with a friend
 * @param {string} friendUid - Friend's uid
 * @returns {Promise<Object>} Created conversation
 */
export const createPrivateConversation = async (friendUid) => {
  const response = await api.post("/conversations/private", {
    friendUid,
  });
  return unwrapResponse(response);
};

/**
 * Create group conversation
 * @param {Object} groupData - Group data (name, memberUids)
 * @returns {Promise<Object>} Created group conversation
 */
export const createGroupConversation = async (groupData) => {
  const response = await api.post("/conversations/group", {
    ...groupData,
  });
  return unwrapResponse(response);
};

/**
 * Mark conversation as read
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Success response
 */
export const markConversationAsRead = async (conversationId) => {
  const response = await api.post(`/conversations/${conversationId}/read`);
  return unwrapResponse(response);
};

// ============================================
// MESSAGE ENDPOINTS
// ============================================

/**
 * Get messages for a conversation (CURSOR-BASED PAGINATION)
 * 
 * ✅ KHÔNG dùng page nữa
 * ✅ Dùng 'before' (messageId) làm cursor
 * ✅ KHÔNG BAO GIỜ TRÙNG
 * 
 * @param {string} conversationId - Conversation ID
 * @param {Object} params - Query params { before?, limit?, mediaType? }
 * @returns {Promise<Object>} { messages, hasMore, oldestMessageId }
 */
export const getMessages = async (conversationId, params = {}) => {
  const { before, limit = 50, mediaType } = params;
  
  // ✅ Build query params - CHỈ gửi before, limit, và mediaType (nếu có)
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
  });
  
  // ✅ Thêm 'before' nếu có (cursor)
  if (before) {
    queryParams.append("before", before);
  }
  
  // 🔥 NEW: Thêm mediaType filter cho tab Media/Video/Audio/File/Link
  if (mediaType) {
    queryParams.append("mediaType", mediaType);
  }
  
  console.log('🌐 [chatApi] GET /messages:', {
    conversationId,
    before: before || 'none',
    limit,
    mediaType: mediaType || 'all',
  });
  
  const response = await api.get(
    `/messages/${conversationId}?${queryParams.toString()}`
  );
  
  const data = unwrapResponse(response);
  
  console.log('✅ [chatApi] Received:', {
    count: data.messages?.length || 0,
    hasMore: data.hasMore,
    oldestMessageId: data.oldestMessageId,
  });
  
  return data; // { messages, hasMore, oldestMessageId }
};

/**
 * 🔥 NEW: Get conversation media (images/videos/audios/files/links)
 * Optimized endpoint for Conversation Info tabs
 * 
 * Backend response:
 * {
 *   items: [
 *     {
 *       id, messageId, url, thumbnailUrl, name, size, mime, type, createdAt
 *     }
 *   ],
 *   hasMore, oldestItemId
 * }
 * 
 * @param {string} conversationId - Conversation ID
 * @param {Object} params - Query params { mediaType, before?, limit? }
 * @returns {Promise<Object>} { items, hasMore, oldestItemId }
 */
export const getConversationMedia = async (conversationId, params = {}) => {
  const { mediaType, before, limit = 20 } = params;
  
  if (!mediaType) {
    throw new Error('mediaType is required');
  }
  
  const queryParams = new URLSearchParams({
    mediaType,
    limit: limit.toString(),
  });
  
  if (before) {
    queryParams.append('before', before);
  }
  
  console.log('🎬 [chatApi] GET /messages/:id/media:', {
    conversationId,
    mediaType,
    before: before || 'none',
    limit,
  });
  
  const response = await api.get(
    `/messages/${conversationId}/media?${queryParams.toString()}`
  );
  
  const data = unwrapResponse(response);
  
  console.log('✅ [chatApi] Media received:', {
    count: data.items?.length || 0,
    hasMore: data.hasMore,
  });
  
  return data; // { items, hasMore, oldestItemId }
};

/**
 * Send new message
 * Backend returns: { success: true, data: { message: {...}, conversation: {...} } }
 * @param {Object} messageData - Message data (conversation, content, type, etc.)
 * @returns {Promise<Object>} { message, conversation }
 */
export const sendMessage = async (messageData) => {
  const response = await api.post("/messages", messageData);
  return unwrapResponse(response);
};

/**
 * Edit existing message
 * @param {string} messageId - Message ID
 * @param {string} newContent - New message content
 * @returns {Promise<Object>} Updated message
 */
export const editMessage = async (messageId, newContent) => {
  const response = await api.put(`/messages/${messageId}`, {
    content: newContent,
  });
  return unwrapResponse(response);
};

/**
 * Delete message
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Success response
 */
export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/messages/${messageId}`);
  return unwrapResponse(response);
};

/**
 * Mark message as read
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Success response
 */
export const markMessageAsRead = async (messageId) => {
  const response = await api.post(`/messages/${messageId}/read`);
  return unwrapResponse(response);
};

// ============================================
// SEARCH
// ============================================

/**
 * Search messages in conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
export const searchMessages = async (conversationId, query) => {
  const response = await api.get(
    `/messages/${conversationId}/search?q=${encodeURIComponent(query)}`
  );
  return unwrapResponse(response);
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  checkConversation,
  getUserConversations,
  getConversationById,
  getConversationInfo,
  createPrivateConversation,
  createGroupConversation,
  markConversationAsRead,
  getMessages,
  getConversationMedia, // 🔥 NEW
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  searchMessages,
};