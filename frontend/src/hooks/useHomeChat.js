// frontend/src/hooks/useHomeChat.js
import { useEffect, useCallback, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import useChatStore from "../store/chatStore";
import * as chatApi from "../services/chatApi";

/**
 * useHomeChat Hook
 * 
 * Manages conversations for Home page
 * Uses Zustand store for state management
 * Provides methods to load, update, and select conversations
 */
export function useHomeChat() {
  const { token, user } = useContext(AuthContext);

  // ============================================
  // GET STATE FROM ZUSTAND STORE (FIXED SELECTOR)
  // ============================================

  // ✅ Get primitives separately (Maps and arrays are stable references)
  const conversationsMap = useChatStore((state) => state.conversations);
  const conversationsOrder = useChatStore((state) => state.conversationsOrder);
  
  // ✅ Convert to array using useMemo (only re-compute when order/map changes)
  const conversations = useMemo(() => {
    return conversationsOrder
      .map((id) => conversationsMap.get(id))
      .filter(Boolean);
  }, [conversationsOrder, conversationsMap]);
  
  const loading = useChatStore((state) => state.loadingConversations);
  const error = useChatStore((state) => state.conversationsError);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  
  // ✅ Get selected conversation using useMemo
  const selectedConversation = useMemo(() => {
    return activeConversationId ? conversationsMap.get(activeConversationId) : null;
  }, [activeConversationId, conversationsMap]);

  // ============================================
  // GET ACTIONS FROM STORE
  // ============================================

  const setConversations = useChatStore((state) => state.setConversations);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversationToStore = useChatStore((state) => state.addConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);
  const setConversationsLoading = useChatStore((state) => state.setConversationsLoading);
  const setConversationsError = useChatStore((state) => state.setConversationsError);

  // ============================================
  // LOAD CONVERSATIONS
  // ============================================

  const loadConversations = useCallback(async () => {
    if (!token || !user) {
      console.log('⏭️  Skipping loadConversations - no token or user');
      return;
    }

    try {
      setConversationsLoading(true);
      setConversationsError(null);

      console.log('📥 Loading conversations...');
      const data = await chatApi.getUserConversations();
      
      const conversationsArray = Array.isArray(data) 
        ? data 
        : (data?.conversations || []);
      
      console.log('✅ Loaded conversations:', conversationsArray.length);
      setConversations(conversationsArray);
      
    } catch (err) {
      console.error("❌ Error loading conversations:", err);
      setConversationsError(err.message || 'Failed to load conversations');
    } finally {
      setConversationsLoading(false);
    }
  }, [token, user, setConversations, setConversationsLoading, setConversationsError]);

  // ============================================
  // UPDATE FROM SOCKET
  // ============================================

  /**
   * Update conversation from socket event
   * Backend sends full conversation update with unreadCount
   */
  const updateConversationFromSocket = useCallback((conversationId, conversationUpdate) => {
    console.log('🔄 [useHomeChat] Updating from socket:', {
      conversationId,
      unreadCount: conversationUpdate.unreadCount,
      lastMessage: conversationUpdate.lastMessage?.content?.substring(0, 20)
    });

    updateConversation(conversationId, {
      lastMessage: conversationUpdate.lastMessage,
      lastMessageAt: conversationUpdate.lastMessage?.createdAt,
      unreadCount: conversationUpdate.unreadCount,
      lastSeenMessage: conversationUpdate.lastSeenMessage,
    });
  }, [updateConversation]);

  // ============================================
  // MARK AS READ
  // ============================================

  /**
   * Mark conversation as read
   * Resets unread count and notifies backend
   */
  const markConversationAsRead = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    console.log('✅ [useHomeChat] Marking as read:', conversationId);
    
    try {
      // Reset unread count immediately (optimistic)
      resetUnreadCount(conversationId);
      
      // Send to backend
      await chatApi.markConversationAsRead(conversationId);
    } catch (err) {
      console.error('❌ Error marking as read:', err);
      // Could revert optimistic update here if needed
    }
  }, [resetUnreadCount]);

  // ============================================
  // SELECT CONVERSATION
  // ============================================

  /**
   * Select a conversation and mark it as read
   */
  const handleSelectConversation = useCallback((conversation) => {
    console.log('🎯 [useHomeChat] Selecting:', conversation?.conversationId || conversation?._id || 'none');
    
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

  /**
   * Add new conversation to store
   * Used when creating new private conversation
   */
  const addConversation = useCallback((newConversation) => {
    console.log('➕ [useHomeChat] Adding conversation:', newConversation._id);
    addConversationToStore(newConversation);
  }, [addConversationToStore]);

  // ============================================
  // LOAD ON MOUNT
  // ============================================

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ============================================
  // RETURN
  // ============================================

  return {
    conversations,
    loading,
    error,
    selectedConversation,
    handleSelectConversation,
    updateConversationFromSocket,
    markConversationAsRead,
    reloadConversations: loadConversations,
    addConversation,
  };
}