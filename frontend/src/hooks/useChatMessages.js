// frontend/src/hooks/useChatMessages.js
import { useEffect, useState, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { messageService } from "../services/messageService";

/**
 * Custom hook để quản lý messages của một conversation
 * Xử lý: load messages, pagination, mark as read, realtime updates
 * 
 * @param {string} conversationId - ID của conversation đang active
 */
export function useChatMessages(conversationId) {
  const { token, user } = useContext(AuthContext);
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load messages lần đầu hoặc refresh
   */
  const loadMessages = useCallback(async () => {
    if (!conversationId || !token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await messageService.getMessages(conversationId, token);
      
      // Backend returns newest first, reverse for UI (oldest first)
      const sortedMessages = [...response.messages].reverse();
      
      setMessages(sortedMessages);
      setHasMore(response.hasMore);
      setLoading(false);
    } catch (err) {
      console.error("Load messages error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [conversationId, token]);

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !token || !hasMore || loading) return;

    try {
      setLoading(true);

      // Get oldest message ID for pagination
      const oldestMessageId = messages[0]?.messageId;
      if (!oldestMessageId) return;

      const response = await messageService.getMessages(
        conversationId, 
        token, 
        oldestMessageId
      );

      // Prepend older messages (reverse because backend returns newest first)
      const olderMessages = [...response.messages].reverse();
      setMessages(prev => [...olderMessages, ...prev]);
      setHasMore(response.hasMore);
      setLoading(false);
    } catch (err) {
      console.error("Load more messages error:", err);
      setLoading(false);
    }
  }, [conversationId, token, messages, hasMore, loading]);

  /**
   * Mark conversation as read
   * ✅ FIXED: Đúng thứ tự tham số và lấy lastSeenMessage
   */
  const markConversationAsRead = useCallback(async () => {
    if (!conversationId || !token || messages.length === 0) return;

    try {
      // Lấy message mới nhất (cuối cùng trong array)
      const lastMessage = messages[messages.length - 1];
      const lastSeenMessage = lastMessage?.messageId;

      
      await messageService.markAsRead(conversationId, token, lastSeenMessage);
      
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  }, [conversationId, token, messages]);

  /**
   * Add new message from socket (realtime)
   * Prevents duplicates by checking messageId
   */
  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(msg => msg.messageId === newMessage.messageId);
      if (exists) return prev;
      
      // Append new message
      return [...prev, newMessage];
    });
  }, []);

  /**
   * Update message read status
   */
  const updateMessageReadStatus = useCallback((userUid, lastSeenMessage) => {
    setMessages(prev =>
      prev.map(msg => {
        // Mark messages as read if:
        // - Sender is current user
        // - Message ID <= lastSeenMessage
        if (msg.sender.uid === user?.uid && msg.messageId <= lastSeenMessage) {
          return { ...msg, read: true };
        }
        return msg;
      })
    );
  }, [user]);

  /**
   * Load messages when conversation changes
   */
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
      setHasMore(false);
    }
  }, [conversationId, loadMessages]);

  /**
   * Mark as read after messages loaded and after a short delay
   */
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;

    const timer = setTimeout(() => {
      markConversationAsRead();
    }, 500);

    return () => clearTimeout(timer);
  }, [conversationId, messages.length, markConversationAsRead]);

  return {
    messages,
    loading,
    hasMore,
    error,
    loadMoreMessages,
    addMessage,
    updateMessageReadStatus,
    markConversationAsRead,
  };
}