// frontend/src/services/messageService.js

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const messageService = {
  async getMessages(conversationId, token, before = null, limit = 50) {
    const params = new URLSearchParams({ limit });

    if (before) {
      params.append("before", before);
    }

    const res = await fetch(
      `${API_BASE_URL}/messages/${conversationId}?${params}`,
      { headers: authHeaders(token) }
    );

    if (!res.ok) {
      throw new Error("Failed to load messages");
    }

    return res.json();
  },

  async getLastMessages(conversationIds, token) {
    const res = await fetch(
      `${API_BASE_URL}/messages/last-messages`,
      {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ conversationIds }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load last messages");
    }

    return res.json();
  },

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
      throw new Error("Failed to send message");
    }

    return res.json();
  },

  async markAsRead(conversationId, token, lastSeenMessage = null) {
    const body = { conversationId };
    if (lastSeenMessage) {
      body.lastSeenMessage = lastSeenMessage;
    }

    const res = await fetch(`${API_BASE_URL}/messages/read`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Failed to mark messages as read:", errorData);
      throw new Error("Failed to mark messages as read");
    }

    return res.json();
  },
};