// frontend/src/user/services/messageService.js

const API_BASE_URL = "/api";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const messageService = {
  /**
   * Get messages with pagination
   */
  async getMessages(conversationId, token, before = null, limit = 50) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) {
      params.append("before", before);
    }

    const res = await fetch(
      `${API_BASE_URL}/messages/${conversationId}?${params}`,
      { 
        headers: authHeaders(token),
        credentials: 'include',
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to load messages");
    }

    const response = await res.json();
    return response.data;
  },

  /**
   * Get last messages for multiple conversations (batch)
   */
  async getLastMessages(conversationIds, token) {
    const res = await fetch(`${API_BASE_URL}/messages/last-messages`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ conversationIds }),
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error("Failed to load last messages");
    }

    const response = await res.json();
    return response.data;
  },

  /**
   * 🔥 Send a message - WITH REPLY + ATTACHMENTS SUPPORT
   */
  async sendMessage(
    conversationId,
    content,
    token,
    type = "text",
    replyTo = null,
    attachments = [],
    clientMessageId = null
  ) {
    const body = {
      conversationId,
      content,
      type,
    };

    // 🔥 Add attachments if provided
    if (attachments && attachments.length > 0) {
      body.attachments = attachments;
    }

    if (replyTo) {
      body.replyTo = replyTo;
    }

    if (clientMessageId) {
      body.clientMessageId = clientMessageId;
    }

    const res = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to send message");
    }

    const response = await res.json();
    return response.data;
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId, token) {
    const res = await fetch(`${API_BASE_URL}/messages/read`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ conversationId }),
      credentials: 'include',
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
   */
  async editMessage(messageId, content, token) {
    const res = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to edit message");
    }

    const response = await res.json();
    return response.data;
  },

  async hideMessage(messageId, token) {
    const res = await fetch(`${API_BASE_URL}/messages/${messageId}/hide`, {
      method: "POST",
      headers: authHeaders(token),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to hide message");
    }

    const response = await res.json();
    return response;
  },

  async deleteForMe(messageId, token) {
    const res = await fetch(`${API_BASE_URL}/messages/${messageId}/delete-for-me`, {
      method: "DELETE",
      headers: authHeaders(token),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete message");
    }

    const response = await res.json();
    return response;
  },

  async recallMessage(messageId, token) {
    const res = await fetch(`${API_BASE_URL}/messages/${messageId}/recall`, {
      method: "POST",
      headers: authHeaders(token),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to recall message");
    }

    const response = await res.json();
    return response;
  },

  async deleteMessage(messageId, token) {
    console.warn("⚠️ deleteMessage is deprecated, use hideMessage or deleteForMe");
    
    const res = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: "DELETE",
      headers: authHeaders(token),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to delete message");
    }

    const response = await res.json();
    return response;
  },
};