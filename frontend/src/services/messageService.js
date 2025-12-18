// services/messageService.js

const API_BASE_URL = "http://localhost:5000/api";

export const messageService = {
  // Load private messages
  async loadPrivateMessages(receiverId, token) {
    const response = await fetch(`${API_BASE_URL}/messages/${receiverId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to load private messages");
    }
    
    return response.json();
  },

  // Load group messages
  async loadGroupMessages(token) {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to load group messages");
    }
    
    return response.json();
  },
};