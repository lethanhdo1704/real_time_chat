// frontend/src/services/api.js
import axios from "axios";

// Create axios instance with base URL for all API requests
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach JWT token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// CONVERSATION SERVICE
// ============================================
/**
 * Service for managing conversations (private and group chats)
 * All methods normalize backend responses by adding _id field
 * for consistency across the application
 */
export const conversationService = {
  /**
   * Fetch all conversations for the current user
   * @param {string} token - JWT authentication token
   * @returns {Object} Normalized conversations list with _id field
   */
  async getUserConversations(token) {
    try {
      const response = await api.get("/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Normalize: Add _id field alongside conversationId for consistency
      const normalized = {
        conversations: (response.data.conversations || []).map(conv => ({
          ...conv,
          _id: conv.conversationId,
        }))
      };

      return normalized;
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      throw error;
    }
  },

  /**
   * Create or retrieve existing private conversation with a friend
   * @param {string} friendUid - Friend's user ID
   * @param {string} token - JWT authentication token
   * @returns {Object} Normalized conversation object with _id field
   */
  async createPrivateConversation(friendUid, token) {
    try {
      const response = await api.post(
        "/conversations/private",
        { friendUid },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Normalize: Add _id field for component compatibility
      const normalized = {
        ...response.data,
        _id: response.data.conversationId,
      };

      return normalized;
    } catch (error) {
      console.error("Error creating private conversation:", error);
      throw error;
    }
  },

  /**
   * Get detailed information for a specific conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} token - JWT authentication token
   * @returns {Object} Normalized conversation details with _id field
   */
  async getConversationDetail(conversationId, token) {
    try {
      const response = await api.get(`/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Normalize: Add _id field
      const normalized = {
        ...response.data,
        _id: response.data.conversationId,
      };

      return normalized;
    } catch (error) {
      console.error("Error fetching conversation detail:", error);
      throw error;
    }
  },

  /**
   * Create a new group conversation with multiple members
   * @param {string} name - Group conversation name
   * @param {string[]} memberUids - Array of member user IDs
   * @param {string} token - JWT authentication token
   * @returns {Object} Normalized group conversation with _id field
   */
  async createGroupConversation(name, memberUids, token) {
    try {
      const response = await api.post(
        "/conversations/group",
        { name, memberUids },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Normalize: Add _id field
      const normalized = {
        ...response.data,
        _id: response.data.conversationId,
      };

      return normalized;
    } catch (error) {
      console.error("Error creating group conversation:", error);
      throw error;
    }
  },
};

export default api;