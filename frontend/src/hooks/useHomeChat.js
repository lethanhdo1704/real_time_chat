// frontend/src/hooks/useHomeChat.js
import { useEffect, useCallback, useContext, useMemo, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { getSocket } from "../services/socketService";
import useChatStore from "../store/chat/chatStore";
import * as chatApi from "../services/chatApi";

/**
 * useHomeChat Hook
 * 
 * 🔥 COMPLETE: Fetch + Socket + UI Logic
 * - Fetches conversations once via store
 * - Listens to real-time socket events
 * - Handles conversation selection
 * - Marks conversations as read
 */
export function useHomeChat() {
  const { token, user } = useContext(AuthContext);

  // ============================================
  // STORE SUBSCRIPTIONS
  // ============================================

  const conversationsOrder = useChatStore((state) => state.conversationsOrder);
  const conversationsMap = useChatStore((state) => state.conversations);
  const loading = useChatStore((state) => state.loadingConversations);
  const error = useChatStore((state) => state.conversationsError);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const conversations = useMemo(() => {
    return conversationsOrder
      .map((id) => conversationsMap.get(id))
      .filter(Boolean);
  }, [conversationsOrder, conversationsMap]);

  const selectedConversation = useMemo(() => {
    return activeConversationId
      ? conversationsMap.get(activeConversationId)
      : null;
  }, [activeConversationId, conversationsMap]);

  // ============================================
  // STORE ACTIONS
  // ============================================

  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversationToStore = useChatStore((state) => state.addConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);
  const fetchConversationsOnce = useChatStore((state) => state.fetchConversationsOnce);

  // ============================================
  // 🔥 SOCKET EVENT HANDLERS
  // ============================================

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket) {
      console.log('⏳ [useHomeChat] Socket not ready');
      return;
    }

    console.log('🔌 [useHomeChat] Setting up socket listeners');

    // Handler: New message received
    const handleMessageReceived = (data) => {
      const { conversationId, message, conversationUpdate } = data;

      console.log('📩 [useHomeChat] Message received:', conversationId);

      if (conversationUpdate) {
        updateConversation(conversationId, {
          lastMessage: conversationUpdate.lastMessage || message,
          lastMessageAt: message.createdAt,
          unreadCount: conversationUpdate.unreadCount,
        });
      }
    };

    // Handler: Message marked as read
    const handleMessageRead = (data) => {
      const { conversationId, conversationUpdate } = data;

      console.log('👁️ [useHomeChat] Message read:', conversationId);

      if (conversationUpdate?.unreadCount !== undefined) {
        updateConversation(conversationId, {
          unreadCount: conversationUpdate.unreadCount,
        });
      }
    };

    // Handler: Message deleted
    const handleMessageDeleted = (data) => {
      const { conversationId, conversationUpdate } = data;

      console.log('🗑️ [useHomeChat] Message deleted:', conversationId);

      if (conversationUpdate?.lastMessage) {
        updateConversation(conversationId, {
          lastMessage: conversationUpdate.lastMessage,
          lastMessageAt: conversationUpdate.lastMessage.createdAt,
        });
      }
    };

    // Handler: Conversation updated
    const handleConversationUpdated = (data) => {
      const { conversationId, updates } = data;

      console.log('🔄 [useHomeChat] Conversation updated:', conversationId);

      updateConversation(conversationId, updates);
    };

    // Subscribe to events
    socket.on('message_received', handleMessageReceived);
    socket.on('message_read', handleMessageRead);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('conversation_updated', handleConversationUpdated);

    // Cleanup
    return () => {
      console.log('🔌 [useHomeChat] Cleaning up socket listeners');
      socket.off('message_received', handleMessageReceived);
      socket.off('message_read', handleMessageRead);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('conversation_updated', handleConversationUpdated);
    };
  }, [updateConversation]);

  // ============================================
  // 🔥 FETCH CONVERSATIONS (ONCE)
  // ============================================

  useEffect(() => {
    if (token && user) {
      console.log('🚀 [useHomeChat] Calling fetchConversationsOnce');
      fetchConversationsOnce();
    }
  }, [token, user, fetchConversationsOnce]);

  // ============================================
  // MARK AS READ
  // ============================================

  const markConversationAsRead = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    console.log('✅ [useHomeChat] Marking as read:', conversationId);
    
    try {
      resetUnreadCount(conversationId);
      await chatApi.markConversationAsRead(conversationId);
    } catch (err) {
      console.error('❌ Error marking as read:', err);
    }
  }, [resetUnreadCount]);

  // ============================================
  // SELECT CONVERSATION
  // ============================================

  const handleSelectConversation = useCallback((conversation) => {
    console.log('🎯 [useHomeChat] Selecting:', conversation?.conversationId || conversation?._id);
    
    if (conversation) {
      const convId = conversation.conversationId || conversation._id;
      setActiveConversation(convId);
      markConversationAsRead(convId);
    } else {
      setActiveConversation(null);
    }
  }, [setActiveConversation, markConversationAsRead]);

  // ============================================
  // ADD CONVERSATION
  // ============================================

  const addConversation = useCallback((newConversation) => {
    console.log('➕ [useHomeChat] Adding conversation:', newConversation._id);
    addConversationToStore(newConversation);
  }, [addConversationToStore]);

  // ============================================
  // RETURN
  // ============================================

  return {
    conversations,
    loading,
    error,
    selectedConversation,
    handleSelectConversation,
    markConversationAsRead,
    reloadConversations: fetchConversationsOnce,
    addConversation,
  };
}