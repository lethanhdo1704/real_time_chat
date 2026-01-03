// frontend/src/hooks/useHomeChat.js
import { useEffect, useCallback, useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import useChatStore from "../../store/chat/chatStore";
import * as chatApi from "../../services/chatApi";

/**
 * 🔥 useHomeChat Hook - CHUẨN HÓA
 * 
 * TRÁCH NHIỆM:
 * ✅ Fetch conversations once
 * ✅ Handle conversation selection
 * ✅ Mark conversations as read
 * ✅ Provide conversation list to UI
 * 
 * ❌ KHÔNG XỬ LÝ SOCKET:
 * - Socket events → useGlobalSocket
 * - Message events → useMessages
 * 
 * NGUYÊN TẮC:
 * - Pure UI/business logic hook
 * - No socket listeners (delegated to useGlobalSocket)
 * - Clean separation of concerns
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

  const addConversationToStore = useChatStore((state) => state.addConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);
  const fetchConversationsOnce = useChatStore((state) => state.fetchConversationsOnce);

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
      console.error('❌ [useHomeChat] Error marking as read:', err);
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
    // Data
    conversations,
    loading,
    error,
    selectedConversation,
    
    // Actions
    handleSelectConversation,
    markConversationAsRead,
    reloadConversations: fetchConversationsOnce,
    addConversation,
  };
}