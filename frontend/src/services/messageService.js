const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const messageService = {
  /**
   * Get messages with pagination
   * @param {string} conversationId - Conversation ID
   * @param {string} token - Auth token
   * @param {string|null} before - Cursor for pagination (messageId)
   * @param {number} limit - Number of messages to fetch
   */
  async getMessages(conversationId, token, before = null, limit = 50) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) {
      params.append("before", before);
    }

    const res = await fetch(
      `${API_BASE_URL}/messages/${conversationId}?${params}`,
      { headers: authHeaders(token) }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to load messages");
    }

    const response = await res.json();
    return response.data; // { messages: [], hasMore: boolean }
  },

  /**
   * Get last messages for multiple conversations (batch)
   * @param {string[]} conversationIds - Array of conversation IDs
   * @param {string} token - Auth token
   */
  async getLastMessages(conversationIds, token) {
    const res = await fetch(`${API_BASE_URL}/messages/last-messages`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ conversationIds }),
    });

    if (!res.ok) {
      throw new Error("Failed to load last messages");
    }

    const response = await res.json();
    return response.data; // { [conversationId]: lastMessage }
  },

  /**
   * Send a message
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   * @param {string} token - Auth token
   * @param {string} type - Message type (text, image, file)
   * @param {string|null} replyTo - Message ID being replied to
   * @param {Array} attachments - File attachments
   */
  async sendMessage(
    conversationId,
    content,
    token,
    type = "text",
    replyTo = null,
    attachments = []
  ) {
    const res = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        conversationId,
        content,
        type,
        replyTo,
        attachments,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to send message");
    }

    const response = await res.json();
    return response.data; // Message object
  },

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {string} token - Auth token
   */
  async markAsRead(conversationId, token) {
    const res = await fetch(`${API_BASE_URL}/messages/read`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ conversationId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to mark as read");
    }

    const response = await res.json();
    return response.data;
  },

  /**
   * Edit message
   * @param {string} messageId - Message ID
   * @param {string} content - New content
   * @param {string} token - Auth token
   */
  async editMessage(messageId, content, token) {
    const res = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to edit message");
    }

    const response = await res.json();
    return response.data;
  },

  /**
   * Delete message
   * @param {string} messageId - Message ID
   * @param {string} token - Auth token
   */
  async deleteMessage(messageId, token) {
    const res = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to delete message");
    }

    const response = await res.json();
    return response;
  },
};