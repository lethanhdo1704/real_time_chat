// frontend/src/hooks/useHomeChat.js
import { useEffect, useCallback, useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import useChatStore from "../../store/chat/chatStore";
import * as chatApi from "../../services/chatApi";

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
  // STORE ACTIONS (stable references)
  // ============================================

  const addConversationToStore = useChatStore((state) => state.addConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);

  // ============================================
  // 🔥 FETCH CONVERSATIONS (ONCE) - OPTIMIZED
  // ============================================

  useEffect(() => {
    // ✅ Only depend on primitive values (token, user.uid)
    // ✅ Call store method directly to avoid function identity issues
    if (token && user?.uid) {
      console.log('🚀 [useHomeChat] Calling fetchConversationsOnce');
      useChatStore.getState().fetchConversationsOnce();
    }
  }, [token, user?.uid]); // ✅ No function in dependencies

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
  // RELOAD CONVERSATIONS (manual trigger)
  // ============================================

  const reloadConversations = useCallback(() => {
    console.log('🔄 [useHomeChat] Manual reload conversations');
    useChatStore.getState().fetchConversationsOnce();
  }, []); // ✅ No dependencies needed - direct store access

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
    reloadConversations,
    addConversation,
  };
}