// frontend/src/hooks/useGlobalSocket.js
import { useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { getSocket } from "../services/socketService";
import useChatStore from "../store/chat/chatStore";

/**
 * Global socket listener for sidebar updates - PRODUCTION READY
 * 
 * ✅ FIXED: Listener registered ONCE per userId (no continuous cleanup/re-register)
 * ✅ FIXED: Normalize data with conversationId before callback
 * ✅ FIXED: Auto-switch from lazy mode
 */
export const useGlobalSocket = ({ onMessageReceived }) => {
  const { user } = useContext(AuthContext);
  const registeredRef = useRef(false); // 🔥 NEW: Prevent re-registration
  
  // Get store state & actions
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const activeFriend = useChatStore((state) => state.activeFriend);
  const conversations = useChatStore((state) => state.conversations);
  
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setActiveFriend = useChatStore((state) => state.setActiveFriend);
  const ensureConversationMessages = useChatStore((state) => state.ensureConversationMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversation = useChatStore((state) => state.addConversation);

  // 🔥 STABLE HANDLER: Won't change on every render
  const handleGlobalMessage = useCallback((data) => {
    let { conversationId, message, conversationUpdate } = data;
    
    // Extract conversationId from message if not present
    if (!conversationId && message?.conversation) {
      conversationId = message.conversation;
      console.log('🔧 [Global] Extracted conversationId from message:', conversationId);
    }
    
    if (!conversationId || !message) {
      console.warn('⚠️ [Global] Invalid message data:', data);
      return;
    }
    
    const normalizedData = {
      conversationId,
      message,
      conversationUpdate,
    };
    
    const isOwnMessage = message.sender?.uid === user?.uid;
    
    console.log('🌍 [Global] Message received:', {
      conversationId,
      from: message.sender?.nickname,
      isOwnMessage,
    });

    // Get current state at time of handling
    const currentActiveConvId = useChatStore.getState().activeConversationId;
    const currentActiveFriend = useChatStore.getState().activeFriend;
    const currentConversations = useChatStore.getState().conversations;

    // ============================================
    // FIX 1: Auto-switch if in lazy mode
    // ============================================
    if (!currentActiveConvId && currentActiveFriend) {
      const isMessageForActiveFriend = 
        message.sender?.uid === currentActiveFriend.uid ||
        (isOwnMessage && conversationId);
      
      if (isMessageForActiveFriend) {
        console.log('🎯 [Global] Auto-switching from lazy mode to:', conversationId);
        
        useChatStore.getState().ensureConversationMessages(conversationId);
        useChatStore.getState().addMessage(conversationId, message);
        useChatStore.getState().setActiveConversation(conversationId);
        useChatStore.getState().setActiveFriend(null);
        
        console.log('✅ [Global] Switched to conversation:', conversationId);
      }
    }
    
    // ============================================
    // FIX 2: Update conversation in sidebar
    // ============================================
    
    const existingConv = currentConversations.get(conversationId);
    
    if (conversationUpdate) {
      if (existingConv) {
        console.log('🔄 [Global] Updating conversation in sidebar:', conversationId);
        useChatStore.getState().updateConversation(conversationId, {
          lastMessage: conversationUpdate.lastMessage,
          lastMessageAt: conversationUpdate.lastMessageAt,
          unreadCount: conversationUpdate.unreadCount,
        });
      } else {
        console.log('🆕 [Global] Adding new conversation to sidebar:', conversationId);
        useChatStore.getState().addConversation({
          _id: conversationId,
          conversationId,
          ...conversationUpdate,
        });
      }
    }
    
    // ============================================
    // FIX 3: Add message to store (for non-active conversations)
    // ============================================
    
    if (conversationId !== currentActiveConvId) {
      console.log('📥 [Global] Adding message to non-active conversation:', conversationId);
      useChatStore.getState().ensureConversationMessages(conversationId);
      useChatStore.getState().addMessage(conversationId, message);
    }
    
    // ============================================
    // FIX 4: Call parent callback with normalized data
    // ============================================
    if (onMessageReceived) {
      console.log('📤 [Global] Calling parent callback with normalized data');
      onMessageReceived(normalizedData);
    }
    
  }, [user?.uid, onMessageReceived]);

  // 🔥 FIXED: Register ONCE per userId
  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !user) {
      return;
    }

    if (!socket.connected) {
      console.log('⏳ [Global] Waiting for socket to connect...');
      return;
    }

    if (registeredRef.current) {
      console.log('⏭️ [Global] Already registered, skip');
      return;
    }

    console.log('🌍 [Global] Registering global message listener for user:', user.uid);
    registeredRef.current = true;

    socket.on('message_received', handleGlobalMessage);

    return () => {
      console.log('🌍 [Global] Global listener cleaned up');
      registeredRef.current = false;
      socket.off('message_received', handleGlobalMessage);
    };
  }, [user?.uid, handleGlobalMessage]); // 🔥 ONLY userId and stable handler

};

export default useGlobalSocket;