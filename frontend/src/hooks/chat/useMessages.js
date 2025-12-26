// frontend/src/hooks/chat/useMessages.js
import { useEffect, useCallback, useRef, useState } from 'react';
import { getSocket } from '../../services/socketService';
import useChatStore from '../../store/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useMessages Hook
 * 
 * Manages messages for active conversation:
 * - Fetches messages with pagination
 * - Listens to real-time socket events (from socketEmitter)
 * - Handles infinite scroll (load older messages)
 * - Auto-scrolls to bottom on new message
 * - Joins/leaves conversation room for typing indicators
 */
const useMessages = (conversationId) => {
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
          setMessages(conversationId, data.messages, data.hasMore);
        } else {
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
  // JOIN/LEAVE CONVERSATION ROOM
  // ============================================

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !conversationId) return;

    console.log('🔌 [Messages] Joining conversation room:', conversationId);

    // ✅ Join conversation room (for typing indicators)
    socket.emit('join_conversation', { conversationId });

    // Cleanup: Leave room
    return () => {
      console.log('🔌 [Messages] Leaving conversation room:', conversationId);
      socket.emit('leave_conversation', { conversationId });
    };
  }, [conversationId]);

  // ============================================
  // SOCKET EVENT LISTENERS
  // ============================================

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !conversationId) return;

    console.log('🔌 [Messages] Setting up listeners for:', conversationId);

    // Handler: New message (from socketEmitter)
    const handleMessageReceived = (data) => {
      const { conversationId: msgConvId, message } = data;

      if (msgConvId !== conversationId) return;

      console.log('📩 [Messages] New message:', message._id);

      addMessage(conversationId, message);
      setTimeout(() => scrollToBottom(), 100);
    };

    // Handler: Message edited (from socketEmitter)
    const handleMessageEdited = (data) => {
      const { conversationId: msgConvId, message } = data;

      if (msgConvId !== conversationId) return;

      console.log('✏️ [Messages] Message edited:', message._id);

      updateMessage(conversationId, message._id, {
        content: message.content,
        editedAt: message.editedAt,
      });
    };

    // Handler: Message deleted (from socketEmitter)
    const handleMessageDeleted = (data) => {
      const { conversationId: msgConvId, messageId } = data;

      if (msgConvId !== conversationId) return;

      console.log('🗑️ [Messages] Message deleted:', messageId);

      removeMessage(conversationId, messageId);
    };

    // Subscribe to socket events
    socket.on('message_received', handleMessageReceived);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    // Cleanup
    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [
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
    hasFetchedRef.current = false;
    setCurrentPage(1);

    if (conversationId) {
      fetchMessages(1);
    }
  }, [conversationId, fetchMessages]);

  // ============================================
  // AUTO SCROLL ON MOUNT
  // ============================================

  useEffect(() => {
    if (messages.length > 0 && hasFetchedRef.current) {
      scrollToBottom(false);
    }
  }, [messages.length, scrollToBottom]);

  return {
    messages,
    loading,
    hasMore,
    error,
    loadMore,
    scrollToBottom,
    messagesEndRef,
  };
};

export default useMessages;