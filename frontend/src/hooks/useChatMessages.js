// frontend/src/hooks/useChatMessages.js
import { useEffect, useState, useCallback, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { messageService } from "../services/messageService";

export function useChatMessages(conversationId) {
  const { token, user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const markedAsReadRef = useRef(false);
  const lastMarkedMessageIdRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      markedAsReadRef.current = false;
      lastMarkedMessageIdRef.current = null;

      const response = await messageService.getMessages(
        conversationId,
        token,
        null,
        50
      );

      const sortedMessages = [...response.messages].reverse();

      setMessages(sortedMessages);
      setHasMore(response.hasMore || false);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setMessages([]);
      setLoading(false);
    }
  }, [conversationId, token]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !token || !hasMore || loading) {
      return;
    }

    if (messages.length === 0) {
      return;
    }

    try {
      setLoading(true);

      const oldestMessage = messages[0];
      const beforeCursor = oldestMessage?.messageId;

      const response = await messageService.getMessages(
        conversationId,
        token,
        beforeCursor,
        50
      );

      const olderMessages = [...response.messages].reverse();
      setMessages((prev) => [...olderMessages, ...prev]);
      setHasMore(response.hasMore || false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, [conversationId, token, messages, hasMore, loading]);

  const addMessage = useCallback((newMessage) => {
    if (!newMessage?.messageId) {
      return;
    }

    setMessages((prev) => {
      const exists = prev.some((msg) => msg.messageId === newMessage.messageId);

      if (exists) {
        return prev;
      }

      return [...prev, newMessage];
    });
  }, []);

  const updateMessageReadStatus = useCallback(
    (userUid, lastSeenMessageId) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.sender?.uid === user?.uid &&
            msg.messageId <= lastSeenMessageId
          ) {
            return { ...msg, read: true };
          }
          return msg;
        })
      );
    },
    [user]
  );

  const markConversationAsRead = useCallback(async () => {
    if (!conversationId || !token) {
      return;
    }

    let shouldMark = false;
    let lastMessageId = null;

    setMessages((currentMessages) => {
      if (currentMessages.length === 0) {
        return currentMessages;
      }

      const lastMessage = currentMessages[currentMessages.length - 1];
      lastMessageId = lastMessage?.messageId;

      if (
        !markedAsReadRef.current ||
        lastMarkedMessageIdRef.current !== lastMessageId
      ) {
        shouldMark = true;
      }

      return currentMessages;
    });

    if (!shouldMark || !lastMessageId) {
      return;
    }

    try {
      markedAsReadRef.current = true;
      lastMarkedMessageIdRef.current = lastMessageId;

      await messageService.markAsRead(conversationId, token, lastMessageId);
    } catch (err) {
      markedAsReadRef.current = false;
      lastMarkedMessageIdRef.current = null;
    }
  }, [conversationId, token]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
      setHasMore(false);
      markedAsReadRef.current = false;
      lastMarkedMessageIdRef.current = null;
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMarkedMessageIdRef.current === lastMessage.messageId) {
      return;
    }

    const timer = setTimeout(() => {
      markConversationAsRead();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
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