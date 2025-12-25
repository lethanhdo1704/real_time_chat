// frontend/src/hooks/chat/useMessages.js
import { useEffect, useCallback, useRef, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import useChatStore from '../../store/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useMessages Hook
 * 
 * Manages messages for active conversation:
 * - Fetches messages with pagination
 * - Listens to real-time socket events
 * - Handles infinite scroll (load older messages)
 * - Auto-scrolls to bottom on new message
 * 
 * Socket Events Handled:
 * - message:new → Add to list
 * - message:edited → Update message
 * - message:deleted → Mark as deleted
 * 
 * @param {string} conversationId - Active conversation ID
 * @returns {Object} { messages, loading, hasMore, loadMore, scrollToBottom }
 */
const useMessages = (conversationId) => {
  const { socket, isConnected } = useSocket();
  const [currentPage, setCurrentPage] = useState(1);
  const hasFetchedRef = useRef(false);
  const messagesEndRef = useRef(null);

  // Get state from store
  const messages = useChatStore((state) => {
    return state.messages.get(conversationId) || [];
  });

  const loading = useChatStore((state) => {
    return state.loadingMessages.get(conversationId) || false;
  });

  const hasMore = useChatStore((state) => {
    return state.hasMoreMessages.get(conversationId) ?? true;
  });

  const error = useChatStore((state) => {
    return state.messagesError.get(conversationId);
  });

  const setMessages = useChatStore((state) => state.setMessages);
  const prependMessages = useChatStore((state) => state.prependMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const setMessagesLoading = useChatStore((state) => state.setMessagesLoading);
  const setMessagesError = useChatStore((state) => state.setMessagesError);

  // ============================================
  // FETCH MESSAGES
  // ============================================

  const fetchMessages = useCallback(
    async (page = 1) => {
      if (!conversationId) return;

      try {
        setMessagesLoading(conversationId, true);
        setMessagesError(conversationId, null);

        const data = await chatApi.fetchMessages(conversationId, {
          page,
          limit: 50,
        });

        if (page === 1) {
          // Initial load
          setMessages(conversationId, data.messages, data.hasMore);
        } else {
          // Pagination - prepend older messages
          prependMessages(conversationId, data.messages, data.hasMore);
        }

        setCurrentPage(page);
        hasFetchedRef.current = true;
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setMessagesError(conversationId, err.message || 'Failed to load messages');
      } finally {
        setMessagesLoading(conversationId, false);
      }
    },
    [
      conversationId,
      setMessages,
      prependMessages,
      setMessagesLoading,
      setMessagesError,
    ]
  );

  // ============================================
  // LOAD MORE (PAGINATION)
  // ============================================

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    fetchMessages(currentPage + 1);
  }, [loading, hasMore, currentPage, fetchMessages]);

  // ============================================
  // SCROLL TO BOTTOM
  // ============================================

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================

  useEffect(() => {
    if (!isConnected || !socket || !conversationId) return;

    // Join conversation room for typing indicators
    socket.joinConversation(conversationId);

    // Handler: New message
    const handleNewMessage = (data) => {
      const { conversationId: msgConvId, message } = data;

      // Only handle if it's for current conversation
      if (msgConvId !== conversationId) return;

      console.log('📩 New message in conversation:', message);

      // Add message to list
      addMessage(conversationId, message);

      // Auto-scroll to bottom after short delay
      setTimeout(() => scrollToBottom(), 100);
    };

    // Handler: Message edited
    const handleMessageEdited = (data) => {
      const { conversationId: msgConvId, message } = data;

      if (msgConvId !== conversationId) return;

      console.log('✏️ Message edited:', message);

      updateMessage(conversationId, message._id, {
        content: message.content,
        editedAt: message.editedAt,
      });
    };

    // Handler: Message deleted
    const handleMessageDeleted = (data) => {
      const { conversationId: msgConvId, messageId } = data;

      if (msgConvId !== conversationId) return;

      console.log('🗑️ Message deleted:', messageId);

      removeMessage(conversationId, messageId);
    };

    // Subscribe to socket events
    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);

    // Cleanup
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);

      // Leave conversation room
      socket.leaveConversation(conversationId);
    };
  }, [
    socket,
    isConnected,
    conversationId,
    addMessage,
    updateMessage,
    removeMessage,
    scrollToBottom,
  ]);

  // ============================================
  // INITIAL FETCH
  // ============================================

  useEffect(() => {
    // Reset state when conversation changes
    hasFetchedRef.current = false;
    setCurrentPage(1);

    // Fetch messages for new conversation
    if (conversationId && isConnected) {
      fetchMessages(1);
    }
  }, [conversationId, isConnected, fetchMessages]);

  // ============================================
  // AUTO SCROLL ON MOUNT
  // ============================================

  useEffect(() => {
    if (messages.length > 0 && hasFetchedRef.current) {
      // Scroll to bottom without animation on initial load
      scrollToBottom(false);
    }
  }, [messages.length, scrollToBottom]);

  // ============================================
  // RETURN
  // ============================================

  return {
    messages,
    loading,
    hasMore,
    error,
    loadMore,
    scrollToBottom,
    messagesEndRef, // Attach to last message element
  };
};

export default useMessages;