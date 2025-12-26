// frontend/src/hooks/chat/useConversations.js
import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../../services/socketService';
import useChatStore from '../../store/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useConversations Hook
 * 
 * Manages conversations list (sidebar):
 * - Fetches conversations on mount
 * - Listens to real-time socket events from socketEmitter service
 * - Updates store automatically
 * - Sorts by lastMessageAt
 * 
 * Socket Events (from socketEmitter service, NOT socket handlers):
 * - message_received → Update lastMessage + unreadCount
 * - message_read → Reset unreadCount
 * - message_deleted → Update lastMessage if needed
 * - conversation_updated → General conversation updates
 */
const useConversations = () => {
  const hasFetchedRef = useRef(false);

  // Get state from store
  const conversations = useChatStore((state) => {
    const conversationsMap = state.conversations;
    const order = state.conversationsOrder;
    return order.map((id) => conversationsMap.get(id)).filter(Boolean);
  });

  const loading = useChatStore((state) => state.loadingConversations);
  const error = useChatStore((state) => state.conversationsError);

  const setConversationsLoading = useChatStore((state) => state.setConversationsLoading);
  const setConversationsError = useChatStore((state) => state.setConversationsError);
  const setConversations = useChatStore((state) => state.setConversations);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversation = useChatStore((state) => state.addConversation);
  const removeConversation = useChatStore((state) => state.removeConversation);
  const updateUnreadCount = useChatStore((state) => state.updateUnreadCount);

  // ============================================
  // FETCH CONVERSATIONS
  // ============================================

  const fetchConversations = useCallback(async () => {
    try {
      setConversationsLoading(true);
      setConversationsError(null);

      const data = await chatApi.fetchConversations();
      setConversations(data);

      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setConversationsError(err.message || 'Failed to load conversations');
    } finally {
      setConversationsLoading(false);
    }
  }, [setConversations, setConversationsLoading, setConversationsError]);

  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket) {
      console.log('⏳ Socket not ready for conversations');
      return;
    }

    console.log('🔌 Setting up conversation socket listeners');

    // Handler: New message received (from socketEmitter)
    const handleMessageReceived = (data) => {
      const { conversationId, message, conversationUpdate } = data;

      console.log('📩 [Conversations] Message received:', { conversationId });

      // Update conversation lastMessage
      updateConversation(conversationId, {
        lastMessage: message,
        lastMessageAt: message.createdAt,
      });

      // Update unread count if provided
      if (conversationUpdate?.unreadCount !== undefined) {
        updateUnreadCount(conversationId, conversationUpdate.unreadCount);
      }
    };

    // Handler: Message marked as read (from socketEmitter)
    const handleMessageRead = (data) => {
      const { conversationId, conversationUpdate } = data;

      console.log('👁️ [Conversations] Message read:', { conversationId });

      // Update unread count
      if (conversationUpdate?.unreadCount !== undefined) {
        updateUnreadCount(conversationId, conversationUpdate.unreadCount);
      }
    };

    // Handler: Message deleted (from socketEmitter)
    const handleMessageDeleted = (data) => {
      const { conversationId, conversationUpdate } = data;

      console.log('🗑️ [Conversations] Message deleted:', { conversationId });

      // Update lastMessage if backend provides it
      if (conversationUpdate?.lastMessage) {
        updateConversation(conversationId, {
          lastMessage: conversationUpdate.lastMessage,
          lastMessageAt: conversationUpdate.lastMessage.createdAt,
        });
      }
    };

    // Handler: Conversation updated (general updates)
    const handleConversationUpdated = (data) => {
      const { conversationId, updates } = data;

      console.log('🔄 [Conversations] Conversation updated:', conversationId);

      updateConversation(conversationId, updates);
    };

    // Subscribe to socket events (these are emitted by socketEmitter service)
    socket.on('message_received', handleMessageReceived);
    socket.on('message_read', handleMessageRead);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('conversation_updated', handleConversationUpdated);

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up conversation listeners');
      socket.off('message_received', handleMessageReceived);
      socket.off('message_read', handleMessageRead);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('conversation_updated', handleConversationUpdated);
    };
  }, [
    updateConversation,
    updateUnreadCount,
    addConversation,
    removeConversation,
  ]);

  // ============================================
  // INITIAL FETCH
  // ============================================

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchConversations();
    }
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
};

export default useConversations;