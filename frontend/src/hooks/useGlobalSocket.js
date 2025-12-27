// frontend/src/hooks/useGlobalSocket.js
import { useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { getSocket } from "../services/socketService";
import useChatStore from "../store/chatStore";

/**
 * Global socket listener for sidebar updates
 * Listens to message_received events for ALL conversations
 * 
 * 🔥 FIXES:
 * 1. Auto-switch to conversation when in lazy mode
 * 2. Update conversation in sidebar when new message arrives (even if not active)
 * 3. Add message to store for ALL conversations (for badge counts)
 * 
 * @param {Function} onMessageReceived - Callback(data) với data = { conversationId, message, conversationUpdate }
 */
export const useGlobalSocket = ({ onMessageReceived }) => {
  const { user } = useContext(AuthContext);
  
  // 🔥 Get store state & actions
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const activeFriend = useChatStore((state) => state.activeFriend);
  const conversations = useChatStore((state) => state.conversations);
  
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setActiveFriend = useChatStore((state) => state.setActiveFriend);
  const ensureConversationMessages = useChatStore((state) => state.ensureConversationMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversation = useChatStore((state) => state.addConversation);

  const handleGlobalMessage = useCallback((data) => {
    // 🔥 FIX: Handle both backend formats
    let { conversationId, message, conversationUpdate } = data;
    
    // Format 1: { conversationId, message, conversationUpdate }
    // Format 2: { message: { conversation: '...' }, conversationUpdate }
    if (!conversationId && message?.conversation) {
      conversationId = message.conversation;
      console.log('🔧 [Global] Extracted conversationId from message:', conversationId);
    }
    
    if (!conversationId || !message) {
      console.warn('⚠️ [Global] Invalid message data:', data);
      return;
    }
    
    const isOwnMessage = message.sender?.uid === user?.uid;
    
    console.log('🌍 [Global] Message received:', {
      conversationId,
      from: message.sender?.nickname,
      isOwnMessage,
      unreadCount: conversationUpdate?.unreadCount,
      currentActive: activeConversationId,
      inLazyMode: !activeConversationId && !!activeFriend
    });

    // ============================================
    // 🔥 FIX 1: Auto-switch if in lazy mode
    // ============================================
    if (!activeConversationId && activeFriend) {
      const isMessageForActiveFriend = 
        message.sender?.uid === activeFriend.uid ||
        (isOwnMessage && conversationId);
      
      if (isMessageForActiveFriend) {
        console.log('🎯 [Global] Auto-switching from lazy mode to:', conversationId);
        
        ensureConversationMessages(conversationId);
        addMessage(conversationId, message);
        setActiveConversation(conversationId);
        setActiveFriend(null);
        
        console.log('✅ [Global] Switched to conversation:', conversationId);
      }
    }
    
    // ============================================
    // 🔥 FIX 2: Update conversation in sidebar
    // ============================================
    
    // Check if conversation exists in store
    const existingConv = conversations.get(conversationId);
    
    if (conversationUpdate) {
      if (existingConv) {
        // Update existing conversation
        console.log('🔄 [Global] Updating conversation in sidebar:', conversationId);
        updateConversation(conversationId, {
          lastMessage: conversationUpdate.lastMessage,
          lastMessageAt: conversationUpdate.lastMessageAt,
          unreadCount: conversationUpdate.unreadCount,
        });
      } else {
        // New conversation from another user - add to sidebar
        console.log('🆕 [Global] Adding new conversation to sidebar:', conversationId);
        addConversation({
          _id: conversationId,
          conversationId,
          ...conversationUpdate,
        });
      }
    }
    
    // ============================================
    // 🔥 FIX 3: Add message to store (for non-active conversations)
    // ============================================
    
    // Only add message if NOT the active conversation
    // (active conversation will handle via useChatSocket)
    if (conversationId !== activeConversationId) {
      console.log('📥 [Global] Adding message to non-active conversation:', conversationId);
      ensureConversationMessages(conversationId);
      addMessage(conversationId, message);
    }
    
    // ============================================
    // 🔥 FIX 4: Call parent callback for additional logic
    // ============================================
    if (onMessageReceived) {
      onMessageReceived(data);
    }
    
  }, [
    user?.uid,
    activeConversationId,
    activeFriend,
    conversations,
    setActiveConversation,
    setActiveFriend,
    ensureConversationMessages,
    addMessage,
    updateConversation,
    addConversation,
    onMessageReceived
  ]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocket();
    
    if (!socket || !socket.connected) {
      console.log('⏳ [Global] Waiting for socket to connect...');
      return;
    }

    console.log('🌍 [Global] Registering global message listener for user:', user.uid);
    socket.on('message_received', handleGlobalMessage);

    return () => {
      socket.off('message_received', handleGlobalMessage);
      console.log('🌍 [Global] Global listener cleaned up');
    };
  }, [user, handleGlobalMessage]);
};

export default useGlobalSocket;