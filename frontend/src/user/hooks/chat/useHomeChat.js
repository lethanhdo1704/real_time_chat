// frontend/src/hooks/useHomeChat.js
import { useEffect, useCallback, useContext, useMemo, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getSocket } from "../../services/socketService";
import useChatStore from "../../store/chat/chatStore";
import * as chatApi from "../../services/chatApi";

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

    // 🔥 FIXED: Handler with conversationId extraction
    const handleMessageReceived = (data) => {
      // 🔥 Extract conversationId (same logic as useGlobalSocket)
      let { conversationId, message, conversationUpdate } = data;
      
      if (!conversationId && message?.conversation) {
        conversationId = message.conversation;
        console.log('🔧 [useHomeChat] Extracted conversationId from message:', conversationId);
      }

      console.log('📩 [useHomeChat] Message received:', conversationId);

      if (conversationId && conversationUpdate) {
        updateConversation(conversationId, {
          lastMessage: conversationUpdate.lastMessage || message,
          lastMessageAt: message.createdAt,
          unreadCount: conversationUpdate.unreadCount,
        });
      } else {
        console.warn('⚠️ [useHomeChat] Missing conversationId or update:', {
          conversationId,
          hasUpdate: !!conversationUpdate
        });
      }
    };

    // 🔥 FIXED: Handler with conversationId extraction
    const handleMessageRead = (data) => {
      let { conversationId, conversationUpdate } = data;
      
      if (!conversationId && data.message?.conversation) {
        conversationId = data.message.conversation;
      }

      console.log('👁️ [useHomeChat] Message read:', conversationId);

      if (conversationId && conversationUpdate?.unreadCount !== undefined) {
        updateConversation(conversationId, {
          unreadCount: conversationUpdate.unreadCount,
        });
      }
    };

    // 🔥 FIXED: Handler with conversationId extraction
    const handleMessageDeleted = (data) => {
      let { conversationId, conversationUpdate } = data;
      
      if (!conversationId && data.message?.conversation) {
        conversationId = data.message.conversation;
      }

      console.log('🗑️ [useHomeChat] Message deleted:', conversationId);

      if (conversationId && conversationUpdate?.lastMessage) {
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

      if (conversationId && updates) {
        updateConversation(conversationId, updates);
      }
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
  // 🔥 UPDATE CONVERSATION FROM SOCKET
  // ============================================

  const updateConversationFromSocket = useCallback((conversationId, updates) => {
    console.log('🔄 [useHomeChat] updateConversationFromSocket:', {
      conversationId,
      updates: Object.keys(updates || {})
    });

    if (!conversationId || !updates) {
      console.warn('⚠️ [useHomeChat] Invalid params:', { conversationId, updates });
      return;
    }

    updateConversation(conversationId, updates);
  }, [updateConversation]);

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
    updateConversationFromSocket,
  };
}