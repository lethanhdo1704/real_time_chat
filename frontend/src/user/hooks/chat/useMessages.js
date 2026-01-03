// frontend/src/hooks/chat/useMessages.js - CURSOR-BASED PAGINATION
import { useEffect, useCallback, useRef } from 'react';
import useChatStore from '../../store/chat/chatStore';
import chatApi from '../../services/chatApi';

/**
 * 🔥 useMessages Hook - CHUẨN HÓA
 * 
 * TRÁCH NHIỆM:
 * ✅ Fetch messages (cursor-based pagination)
 * ✅ Handle message_received (add to chat)
 * ✅ Handle message_recalled (update UI)
 * ✅ Handle message_deleted (remove from chat)
 * ✅ Handle message_edited (update content)
 * ✅ Join/leave conversation socket rooms
 * 
 * NGUYÊN TẮC:
 * - Single source of truth for message content
 * - Cursor-based pagination (no page numbers)
 * - Store-level lock (hasJoinedConversation)
 * - Socket listeners inside effect
 * - Ignore own messages from socket
 */

const EMPTY_ARRAY = [];

const useMessages = (conversationId) => {
  const hasFetchedRef = useRef(false);
  const messagesEndRef = useRef(null);
  
  // 🔥 CURSOR-BASED: Track oldest message ID
  const oldestMessageIdRef = useRef(null);

  // ============================================
  // STABLE SELECTORS
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

  const hasMessages = messages.length > 0;

  // ============================================
  // FETCH MESSAGES (CURSOR-BASED)
  // ============================================

  const fetchMessages = useCallback(
    async (isInitial = false) => {
      if (!conversationId) return;

      // If not initial and no cursor → skip
      if (!isInitial && !oldestMessageIdRef.current) {
        console.log('⏭️ [useMessages] No cursor available, skipping');
        return;
      }

      try {
        const { setMessagesLoading, setMessagesError, setMessages, prependMessages } = 
          useChatStore.getState();

        setMessagesLoading(conversationId, true);
        setMessagesError(conversationId, null);

        // CURSOR-BASED: Send 'before' instead of 'page'
        const params = { limit: 50 };
        if (!isInitial && oldestMessageIdRef.current) {
          params.before = oldestMessageIdRef.current;
        }

        console.log('📥 [useMessages] Fetching messages:', {
          conversationId,
          isInitial,
          before: params.before || 'none',
          limit: params.limit,
        });

        const data = await chatApi.getMessages(conversationId, params);

        console.log('📦 [useMessages] API returned:', {
          messagesCount: data.messages.length,
          hasMore: data.hasMore,
        });

        // No more messages → stop
        if (data.messages.length === 0) {
          console.log('⏹️ [useMessages] No more messages');
          setMessagesLoading(conversationId, false);
          const { setHasMoreMessages } = useChatStore.getState();
          setHasMoreMessages(conversationId, false);
          return;
        }

        // UPDATE CURSOR: Get oldest message as cursor for next load
        const oldestMessage = data.messages[0];
        oldestMessageIdRef.current = oldestMessage?.messageId || oldestMessage?._id;

        console.log('🔖 [useMessages] Updated cursor:', oldestMessageIdRef.current);

        if (isInitial) {
          setMessages(conversationId, data.messages, data.hasMore);
        } else {
          prependMessages(conversationId, data.messages, data.hasMore);
        }

        hasFetchedRef.current = true;
        
        console.log(`✅ [useMessages] Loaded ${data.messages.length} messages`);
        
        return data;
      } catch (err) {
        console.error('❌ [useMessages] Failed to fetch messages:', err);
        
        const { setMessagesError } = useChatStore.getState();
        setMessagesError(conversationId, err.message || 'Failed to load messages');
      } finally {
        const { setMessagesLoading } = useChatStore.getState();
        setMessagesLoading(conversationId, false);
      }
    },
    [conversationId]
  );

  // ============================================
  // LOAD MORE (CURSOR-BASED)
  // ============================================

  const loadMore = useCallback(() => {
    if (loading || !hasMore) {
      console.log('⏭️ [useMessages] Skip loadMore:', { loading, hasMore });
      return;
    }

    console.log('📄 [useMessages] Loading more messages...');
    fetchMessages(false);
  }, [loading, hasMore, fetchMessages]);

  // ============================================
  // SCROLL TO BOTTOM
  // ============================================

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // ============================================
  // 🔥 MAIN EFFECT - STORE-LEVEL LOCK
  // ============================================

  useEffect(() => {
    if (!conversationId) return;

    // STORE-LEVEL LOCK: Check if already joined
    const { hasJoinedConversation, markConversationJoined } = useChatStore.getState();
    
    if (hasJoinedConversation(conversationId)) {
      console.log('⏭️ [useMessages] Already joined at store level, skip');
      return;
    }

    console.log('🔌 [useMessages] Initializing conversation:', conversationId);

    // MARK AS JOINED IMMEDIATELY
    markConversationJoined(conversationId);

    // Get socket inside effect
    const getSocketSafe = async () => {
      const { getSocket } = await import('../../services/socketService');
      return getSocket();
    };

    let socket = null;
    let cleanup = null;

    const initialize = async () => {
      socket = await getSocketSafe();

      if (!socket) {
        console.warn('⚠️ [useMessages] Socket not available');
        return;
      }

      // 1. Join room
      console.log('🔌 [useMessages] Joining room:', conversationId);
      socket.emit('join_conversation', { conversationId });

      // 2. Setup listeners
      console.log('🔌 [useMessages] Setting up message listeners');

      // ============================================
      // 🔥 MESSAGE_RECEIVED - SINGLE SOURCE OF TRUTH
      // ============================================
      const handleMessageReceived = (data) => {
        const { message } = data;

        if (!message) return;

        const messageConvId = message.conversation || message.conversationId;
        if (!messageConvId || messageConvId !== conversationId) return;

        const { currentUser, addMessage } = useChatStore.getState();

        // ✅ CRITICAL: Ignore own messages (already added optimistically)
        if (currentUser && message.sender?.uid === currentUser.uid) {
          console.log('⏭️ [useMessages] Ignoring own message:', message.messageId);
          return;
        }

        console.log('✅ [useMessages] New message received:', message.messageId);

        addMessage(conversationId, message);
        setTimeout(() => scrollToBottom(), 100);
      };

      // ============================================
      // MESSAGE_RECALLED
      // ============================================
      const handleMessageRecalled = (data) => {
        const { messageId, conversationId: dataConvId, recalledBy, recalledAt } = data;
        
        if (!messageId) return;
        if (dataConvId && dataConvId !== conversationId) return;

        console.log('↩️ [useMessages] Message recalled:', messageId);

        const { updateMessage } = useChatStore.getState();
        updateMessage(conversationId, messageId, {
          isRecalled: true,
          recalledBy,
          recalledAt,
        });
      };

      // ============================================
      // MESSAGE_EDITED
      // ============================================
      const handleMessageEdited = (data) => {
        const { message } = data;
        if (!message) return;

        const messageConvId = 
          data.conversationId || 
          message.conversation || 
          message.conversationId;

        if (!messageConvId || messageConvId !== conversationId) return;

        console.log('✏️ [useMessages] Message edited:', message.messageId);

        const { updateMessage } = useChatStore.getState();
        updateMessage(conversationId, message.messageId, {
          content: message.content,
          editedAt: message.editedAt,
        });
      };

      // ============================================
      // MESSAGE_DELETED
      // ============================================
      const handleMessageDeleted = (data) => {
        const { messageId, conversationId: dataConvId } = data;
        
        if (!messageId) return;
        if (dataConvId && dataConvId !== conversationId) return;

        console.log('🗑️ [useMessages] Message deleted:', messageId);

        const { removeMessage } = useChatStore.getState();
        removeMessage(conversationId, messageId);
      };

      // Register all listeners
      socket.on('message_received', handleMessageReceived);
      socket.on('message_recalled', handleMessageRecalled);
      socket.on('message_edited', handleMessageEdited);
      socket.on('message_deleted', handleMessageDeleted);

      console.log('✅ [useMessages] All message listeners registered');

      // 3. Fetch initial messages
      hasFetchedRef.current = false;
      oldestMessageIdRef.current = null;
      fetchMessages(true);

      // Cleanup function
      cleanup = () => {
        console.log('🧹 [useMessages] Cleaning up conversation:', conversationId);
        
        if (socket) {
          socket.emit('leave_conversation', { conversationId });
          socket.off('message_received', handleMessageReceived);
          socket.off('message_recalled', handleMessageRecalled);
          socket.off('message_edited', handleMessageEdited);
          socket.off('message_deleted', handleMessageDeleted);
        }
      };
    };

    initialize();

    return () => {
      if (cleanup) cleanup();
    };
  }, [conversationId, fetchMessages, scrollToBottom]);

  // ============================================
  // RETURN
  // ============================================

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