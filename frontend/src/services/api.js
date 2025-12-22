// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

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

// Conversation Service
export const conversationService = {
  /**
   * Get all conversations for current user
   */
  async getConversations(token) {
    
    try {
      const response = await api.get("/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create or get private conversation with a friend
   */
  async createPrivateConversation(friendId, token) {
  
    
    try {
      const response = await api.post(
        "/conversations/private",
        { friendUid: friendId },  // 🔧 FIX: Change friendId to friendUid
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    
      
      return response.data;
    } catch (error) {
     
      throw error;
    }
  },

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId, token) {

    
    try {
      const response = await api.get(`/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      
      return response.data;
    } catch (error) {
      console.error('🟪 [API] getConversation error:', error);
      throw error;
    }
  },
};

export default api;