// frontend/src/hooks/useHomeChat.js
import { useEffect, useCallback, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import useChatStore from "../store/chatStore";
import * as chatApi from "../services/chatApi";

/**
 * useHomeChat Hook
 * 
 * 🔥 FIXED: Proper reactivity with useMemo and store subscription
 * Now sidebar WILL update when store changes
 */
export function useHomeChat() {
  const { token, user } = useContext(AuthContext);

  // ============================================
  // 🔥 FIX: Subscribe to BOTH conversationsOrder AND conversations Map
  // ============================================

  const conversationsOrder = useChatStore((state) => state.conversationsOrder);
  const conversationsMap = useChatStore((state) => state.conversations); // 🔥 ADD THIS
  const loading = useChatStore((state) => state.loadingConversations);
  const error = useChatStore((state) => state.conversationsError);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  // ============================================
  // 🔥 FIX: Use useMemo with proper dependencies
  // ============================================

  // Convert to array with useMemo (recomputes when order or map changes)
  const conversations = useMemo(() => {
    console.log('🔄 [useHomeChat] Recomputing conversations array');
    return conversationsOrder
      .map((id) => conversationsMap.get(id))
      .filter(Boolean);
  }, [conversationsOrder, conversationsMap]); // 🔥 Depend on BOTH

  // Get selected conversation with useMemo
  const selectedConversation = useMemo(() => {
    return activeConversationId
      ? conversationsMap.get(activeConversationId)
      : null;
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
   * 🔥 FIXED: Update conversation from socket event
   */
  const updateConversationFromSocket = useCallback((conversationId, conversationUpdate) => {
    console.log('🔄 [useHomeChat] Updating from socket:', {
      conversationId,
      unreadCount: conversationUpdate?.unreadCount,
      lastMessage: conversationUpdate?.lastMessage?.content?.substring(0, 20)
    });

    if (!conversationUpdate) {
      console.warn('⚠️ [useHomeChat] No conversationUpdate provided');
      return;
    }

    // 🔥 Check if conversation exists in store
    const existingConv = useChatStore.getState().conversations.get(conversationId);
    
    if (existingConv) {
      // Update existing conversation
      updateConversation(conversationId, {
        lastMessage: conversationUpdate.lastMessage,
        lastMessageAt: conversationUpdate.lastMessage?.createdAt || conversationUpdate.lastMessageAt,
        unreadCount: conversationUpdate.unreadCount,
        lastSeenMessage: conversationUpdate.lastSeenMessage,
      });
      console.log('✅ [useHomeChat] Updated existing conversation');
    } else {
      // Add new conversation if it doesn't exist
      console.log('🆕 [useHomeChat] Adding new conversation from socket');
      addConversationToStore({
        _id: conversationId,
        conversationId,
        ...conversationUpdate,
      });
    }
  }, [updateConversation, addConversationToStore]);

  // ============================================
  // MARK AS READ
  // ============================================

  /**
   * Mark conversation as read
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
   */
  const addConversation = useCallback((newConversation) => {
    console.log('➕ [useHomeChat] Adding conversation:', newConversation._id);
    addConversationToStore(newConversation);
  }, [addConversationToStore]);

  // ============================================
  // LOAD ON MOUNT (only once)
  // ============================================

  useEffect(() => {
    if (token && user) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]); // Only depend on token and user

  // 🔥 DEBUG: Log when conversations change
  useEffect(() => {
    console.log('🔄 [useHomeChat] Conversations changed:', {
      count: conversations.length,
      ids: conversations.map(c => c.conversationId || c._id)
    });
  }, [conversations]);

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