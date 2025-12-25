// frontend/src/hooks/chat/useConversations.js
import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import useChatStore from '../../store/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useConversations Hook
 * 
 * Manages conversations list (sidebar):
 * - Fetches conversations on mount
 * - Listens to real-time socket events
 * - Updates store automatically
 * - Sorts by lastMessageAt
 * 
 * Socket Events Handled:
 * - message:new → Update lastMessage + unreadCount
 * - message:read → Reset unreadCount
 * - message:deleted → Update lastMessage if needed
 * - conversation:joined → Add new conversation
 * - conversation:left → Remove conversation
 * 
 * @returns {Object} { conversations, loading, error, refetch }
 */
const useConversations = () => {
  const { socket, isConnected } = useSocket();
  const hasFetchedRef = useRef(false);

  // Get state from store
  const conversations = useChatStore((state) => {
    const conversationsMap = state.conversations;
    const order = state.conversationsOrder;
    // Return as array in correct order
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
    if (!isConnected || !socket) return;

    // Handler: New message received
    const handleNewMessage = (data) => {
      const { conversationId, message, conversationUpdate } = data;

      console.log('📩 New message received:', { conversationId, message });

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

    // Handler: Message marked as read
    const handleMessageRead = (data) => {
      const { conversationId, conversationUpdate } = data;

      console.log('👁️ Message read:', { conversationId });

      // Update unread count
      if (conversationUpdate?.unreadCount !== undefined) {
        updateUnreadCount(conversationId, conversationUpdate.unreadCount);
      }
    };

    // Handler: Message deleted
    const handleMessageDeleted = (data) => {
      const { conversationId, conversationUpdate } = data;

      console.log('🗑️ Message deleted:', { conversationId });

      // Update lastMessage if backend provides it
      if (conversationUpdate?.lastMessage) {
        updateConversation(conversationId, {
          lastMessage: conversationUpdate.lastMessage,
          lastMessageAt: conversationUpdate.lastMessage.createdAt,
        });
      }
    };

    // Handler: Joined new conversation
    const handleConversationJoined = (data) => {
      const { conversation } = data;

      console.log('➕ Joined conversation:', conversation);

      addConversation(conversation);
    };

    // Handler: Left conversation
    const handleConversationLeft = (data) => {
      const { conversationId } = data;

      console.log('➖ Left conversation:', conversationId);

      removeConversation(conversationId);
    };

    // Subscribe to socket events
    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('conversation:joined', handleConversationJoined);
    socket.on('conversation:left', handleConversationLeft);

    // Cleanup
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleMessageRead);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('conversation:joined', handleConversationJoined);
      socket.off('conversation:left', handleConversationLeft);
    };
  }, [
    socket,
    isConnected,
    updateConversation,
    updateUnreadCount,
    addConversation,
    removeConversation,
  ]);

  // ============================================
  // INITIAL FETCH
  // ============================================

  useEffect(() => {
    // Fetch conversations once when socket connects
    if (isConnected && !hasFetchedRef.current) {
      fetchConversations();
    }
  }, [isConnected, fetchConversations]);

  // ============================================
  // RETURN
  // ============================================

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
};

export default useConversations;
