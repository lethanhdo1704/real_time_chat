// frontend/src/hooks/useGlobalSocket.js
import { useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import useChatStore from "../../store/chat/chatStore";

/**
 * 🔥 GLOBAL SOCKET LISTENER - CHUẨN HÓA
 * 
 * TRÁCH NHIỆM:
 * ✅ Conversation metadata (lastMessage, unread, reorder)
 * ✅ Conversation lifecycle (created, updated)
 * ✅ User-specific events (not message content)
 * 
 * ❌ KHÔNG XỬ LÝ:
 * - message_received content → useMessages
 * - message_recalled/deleted/edited → useMessages
 * 
 * NGUYÊN TẮC:
 * - Register ONCE per connection
 * - Use SocketContext (consistent pattern)
 * - Stable handlers (useCallback)
 */
export const useGlobalSocket = ({ 
  onConversationUpdate,
  onConversationCreated 
}) => {
  const { user } = useContext(AuthContext);
  const { socket, isConnected } = useContext(SocketContext);
  const registeredRef = useRef(false);

  // ============================================
  // HANDLER: CONVERSATION UPDATE (metadata only)
  // ============================================
  const handleConversationUpdate = useCallback((data) => {
    const { conversationId, lastMessage, lastMessageAt, unreadCount } = data;
    
    if (!conversationId) {
      console.warn('⚠️ [Global] Missing conversationId in conversation_update');
      return;
    }

    console.log('🔔 [Global] Conversation update:', {
      conversationId,
      unreadCount,
      hasLastMessage: !!lastMessage,
    });

    const { conversations, updateConversation, addConversation } = useChatStore.getState();
    const existingConv = conversations.get(conversationId);

    if (existingConv) {
      // Update existing conversation
      updateConversation(conversationId, {
        lastMessage,
        lastMessageAt,
        unreadCount,
      });
    } else {
      // Add new conversation (shouldn't happen often)
      console.log('🆕 [Global] Adding new conversation:', conversationId);
      addConversation({
        _id: conversationId,
        conversationId,
        lastMessage,
        lastMessageAt,
        unreadCount,
      });
    }

    // Call parent callback if provided
    if (onConversationUpdate) {
      onConversationUpdate(data);
    }
  }, [onConversationUpdate]);

  // ============================================
  // HANDLER: CONVERSATION CREATED
  // ============================================
  const handleConversationCreated = useCallback((data) => {
    const { conversation } = data;
    
    if (!conversation) {
      console.warn('⚠️ [Global] Missing conversation in conversation_created');
      return;
    }

    console.log('🆕 [Global] Conversation created:', conversation._id);

    const { addConversation } = useChatStore.getState();
    addConversation(conversation);

    // Call parent callback if provided
    if (onConversationCreated) {
      onConversationCreated(data);
    }
  }, [onConversationCreated]);

  // ============================================
  // HANDLER: CONVERSATION JOINED (when added to group)
  // ============================================
  const handleConversationJoined = useCallback((data) => {
    const { conversationId, conversation } = data;
    
    console.log('👥 [Global] Joined conversation:', conversationId);

    if (conversation) {
      const { addConversation } = useChatStore.getState();
      addConversation(conversation);
    }
  }, []);

  // ============================================
  // HANDLER: CONVERSATION LEFT (when removed from group)
  // ============================================
  const handleConversationLeft = useCallback((data) => {
    const { conversationId, reason } = data;
    
    console.log('👋 [Global] Left conversation:', conversationId, 'reason:', reason);

    const { removeConversation, setActiveConversation, activeConversationId } = useChatStore.getState();
    
    // Remove from list
    removeConversation(conversationId);
    
    // Clear active if was active
    if (activeConversationId === conversationId) {
      setActiveConversation(null);
    }
  }, []);

  // ============================================
  // REGISTER SOCKET LISTENERS (ONCE)
  // ============================================
  useEffect(() => {
    if (!socket || !isConnected || !user) {
      console.log('⏳ [Global] Waiting for socket/user...');
      return;
    }

    if (registeredRef.current) {
      console.log('⏭️ [Global] Already registered, skip');
      return;
    }

    console.log('🌍 [Global] Registering global listeners for user:', user.uid);
    registeredRef.current = true;

    // ============================================
    // ✅ ONLY LISTEN TO CONVERSATION METADATA
    // ❌ NO message_received (handled by useMessages)
    // ============================================
    socket.on('conversation_update', handleConversationUpdate);
    socket.on('conversation_created', handleConversationCreated);
    socket.on('conversation_joined', handleConversationJoined);
    socket.on('conversation_left', handleConversationLeft);

    console.log('✅ [Global] All global listeners registered');

    return () => {
      console.log('🌍 [Global] Cleaning up global listeners');
      registeredRef.current = false;
      
      socket.off('conversation_update', handleConversationUpdate);
      socket.off('conversation_created', handleConversationCreated);
      socket.off('conversation_joined', handleConversationJoined);
      socket.off('conversation_left', handleConversationLeft);
    };
  }, [
    socket, 
    isConnected, 
    user?.uid,
    handleConversationUpdate,
    handleConversationCreated,
    handleConversationJoined,
    handleConversationLeft,
  ]);

  // Reset registration flag on disconnect
  useEffect(() => {
    if (!isConnected) {
      registeredRef.current = false;
    }
  }, [isConnected]);

  return null; // This hook doesn't return anything
};

export default useGlobalSocket;