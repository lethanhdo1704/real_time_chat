// frontend/src/hooks/chat/useMessages.js
import { useEffect, useCallback, useRef, useState } from 'react';
import { getSocket } from '../../services/socketService';
import useChatStore from '../../store/chat/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useMessages Hook
 * 
 * ✅ FIXED: Correct event data structure
 * ✅ FIXED: Ignore own messages to prevent double add
 * Backend emits: { message: {...}, conversationUpdate: {...} }
 */

// ✅ Shared empty array reference (prevent new [] on every render)
const EMPTY_ARRAY = [];

const useMessages = (conversationId) => {
  const [currentPage, setCurrentPage] = useState(1);
  const hasFetchedRef = useRef(false);
  const messagesEndRef = useRef(null);

  // ============================================
  // ✅ STABLE SELECTORS
  // ============================================

  const messages = useChatStore((state) => {
    if (!conversationId) return EMPTY_ARRAY;
    return state.messages.get(conversationId) || EMPTY_ARRAY;
  });

  const loading = useChatStore((state) => {
    if (!conversationId) return false;
    return state.loadingMessages.get(conversationId) || false;
  });

  const hasMore = useChatStore((state) => {
    if (!conversationId) return true;
    return state.hasMoreMessages.get(conversationId) ?? true;
  });

  const error = useChatStore((state) => {
    if (!conversationId) return null;
    return state.messagesError.get(conversationId);
  });

  // Get current user (for checking own messages)
  const currentUser = useChatStore((state) => state.currentUser);

  // Get actions (these are stable)
  const setMessages = useChatStore((state) => state.setMessages);
  const prependMessages = useChatStore((state) => state.prependMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const setMessagesLoading = useChatStore((state) => state.setMessagesLoading);
  const setMessagesError = useChatStore((state) => state.setMessagesError);

  const hasMessages = messages.length > 0;

  // ============================================
  // FETCH MESSAGES
  // ============================================

  const fetchMessages = useCallback(
    async (page = 1) => {
      if (!conversationId) return;

      try {
        setMessagesLoading(conversationId, true);
        setMessagesError(conversationId, null);

        console.log(`📥 [useMessages] Fetching page ${page} for:`, conversationId);

        const data = await chatApi.getMessages(conversationId, {
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
        
        console.log(`✅ [useMessages] Loaded ${data.messages.length} messages`);
      } catch (err) {
        console.error('❌ [useMessages] Failed to fetch messages:', err);
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
    console.log(`📄 [useMessages] Loading more, page:`, currentPage + 1);
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

    console.log('🔌 [useMessages] Joining conversation room:', conversationId);

    socket.emit('join_conversation', { conversationId });

    return () => {
      console.log('🔌 [useMessages] Leaving conversation room:', conversationId);
      socket.emit('leave_conversation', { conversationId });
    };
  }, [conversationId]);

  // ============================================
  // SOCKET EVENT LISTENERS
  // ============================================

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !conversationId) return;

    console.log('🔌 [useMessages] Setting up listeners for:', conversationId);

    // 🔥 FIX: Correct data structure + Ignore own messages
    const handleMessageReceived = (data) => {
      console.log('🔥 [DEBUG] message_received event:', data);

      // Backend emits: { message: {...}, conversationUpdate: {...} }
      const { message, conversationUpdate } = data;

      if (!message) {
        console.error('❌ [useMessages] No message in event data');
        return;
      }

      // Check if message is for this conversation
      if (message.conversation !== conversationId) {
        console.log('⚠️ [useMessages] Message for different conversation');
        return;
      }

      // 🔥 FIX: Ignore messages from current user (already added when sending)
      if (currentUser && message.sender?.uid === currentUser.uid) {
        console.log('⚠️ [useMessages] Ignoring own message (already added):', message.messageId);
        return;
      }

      console.log('✅ [useMessages] New message received:', {
        messageId: message.messageId,
        from: message.sender?.nickname,
        content: message.content
      });

      addMessage(conversationId, message);
      setTimeout(() => scrollToBottom(), 100);
    };

    // 🔥 FIX: Correct data structure
    const handleMessageEdited = (data) => {
      console.log('🔥 [DEBUG] message_edited event:', data);

      const { message, conversationId: msgConvId } = data;

      if (!message || msgConvId !== conversationId) return;

      console.log('✏️ [useMessages] Message edited:', message.messageId);

      updateMessage(conversationId, message.messageId, {
        content: message.content,
        editedAt: message.editedAt,
      });
    };

    // 🔥 FIX: Correct data structure
    const handleMessageDeleted = (data) => {
      console.log('🔥 [DEBUG] message_deleted event:', data);

      const { messageId, conversationId: msgConvId } = data;

      if (msgConvId !== conversationId) return;

      console.log('🗑️ [useMessages] Message deleted:', messageId);

      removeMessage(conversationId, messageId);
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    console.log('✅ [useMessages] All listeners registered');

    return () => {
      console.log('🧹 [useMessages] Cleaning up listeners');
      socket.off('message_received', handleMessageReceived);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [
    conversationId,
    currentUser, // 🔥 NEW: Add currentUser to dependencies
    addMessage,
    updateMessage,
    removeMessage,
    scrollToBottom,
  ]);

  // ============================================
  // INITIAL FETCH (only when conversationId changes)
  // ============================================

  useEffect(() => {
    if (conversationId) {
      hasFetchedRef.current = false;
      setCurrentPage(1);
      fetchMessages(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ============================================
  // AUTO SCROLL ON MOUNT (only after initial fetch)
  // ============================================

  useEffect(() => {
    if (hasMessages && hasFetchedRef.current) {
      setTimeout(() => scrollToBottom(false), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return {
    messages,
    loading,
    hasMore,
    error,
    hasMessages,
    loadMore,
    scrollToBottom,
    messagesEndRef,
  };
};

export default useMessages;