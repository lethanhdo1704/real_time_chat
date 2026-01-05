// frontend/src/hooks/useGlobalSocket.js - WITH GLOBAL MESSAGE_RECALLED

import { useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import useChatStore from "../../store/chat/chatStore";

/**
 * 🔥 GLOBAL SOCKET LISTENER - WITH MESSAGE_RECALLED
 * 
 * TRÁCH NHIỆM:
 * ✅ Conversation metadata (lastMessage, unread, reorder)
 * ✅ Conversation lifecycle (created, updated)
 * ✅ User-specific events (not message content)
 * ✅ 🆕 message_recalled (update sidebar for ALL conversations)
 * 
 * ❌ KHÔNG XỬ LÝ:
 * - message_received content → useMessages
 * - message_recalled/deleted/edited content in active chat → useMessages
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
      // ============================================
      // 🔥 FIX: Don't overwrite recalled message (SAME messageId only)
      // ============================================
      const existingLastMessage = existingConv.lastMessage;
      const incomingMessageId = lastMessage?.messageId || lastMessage?._id;
      const existingMessageId = existingLastMessage?.messageId || existingLastMessage?._id;
      
      const shouldPreserveRecalled = 
        existingLastMessage?.isRecalled === true &&
        incomingMessageId === existingMessageId; // 🔥 Same message!
      
      if (shouldPreserveRecalled) {
        console.log('⏭️ [Global] Preserving recalled lastMessage (same messageId), only updating metadata');
        // Keep recalled message, only update unreadCount
        updateConversation(conversationId, {
          lastMessageAt,
          unreadCount,
        });
      } else {
        // Normal update
        updateConversation(conversationId, {
          lastMessage,
          lastMessageAt,
          unreadCount,
        });
      }
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
  // 🆕 HANDLER: MESSAGE RECALLED (GLOBAL - for sidebar)
  // ============================================
  /**
   * Handle message_recalled globally to update sidebar
   * even when not in the conversation
   * 
   * This ensures sidebar shows "Message recalled" immediately
   * regardless of which conversation user is viewing
   */
  const handleMessageRecalledGlobal = useCallback((data) => {
    const { conversationId, messageId, recalledBy, recalledAt } = data;
    
    if (!conversationId || !messageId) {
      console.warn('⚠️ [Global] Missing data in message_recalled');
      return;
    }

    console.log('↩️ [Global] Message recalled:', {
      conversationId,
      messageId,
      recalledBy,
    });

    const { conversations, updateConversation } = useChatStore.getState();
    const conversation = conversations.get(conversationId);
    
    if (!conversation?.lastMessage) {
      console.log('⏭️ [Global] No lastMessage in conversation, skip');
      return;
    }

    const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
    
    // Only update if recalled message is the lastMessage
    if (lastMessageId === messageId) {
      console.log('🔥 [Global] Recalled message IS lastMessage - updating sidebar');
      
      updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          isRecalled: true,
          content: "", // Clear content
          recalledAt,
          recalledBy,
        },
      });
      
      console.log('✅ [Global] Sidebar updated for recalled message');
    } else {
      console.log('⏭️ [Global] Recalled message is NOT lastMessage, no update needed');
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
    // ✅ CONVERSATION METADATA EVENTS
    // ============================================
    socket.on('conversation_update', handleConversationUpdate);
    socket.on('conversation_created', handleConversationCreated);
    socket.on('conversation_joined', handleConversationJoined);
    socket.on('conversation_left', handleConversationLeft);
    
    // ============================================
    // 🆕 MESSAGE EVENTS (for sidebar updates)
    // ============================================
    socket.on('message_recalled', handleMessageRecalledGlobal);
    
    // Note: message_received is handled by conversation_update
    // Note: message_deleted and message_edited don't affect sidebar much

    console.log('✅ [Global] All global listeners registered');

    return () => {
      console.log('🌍 [Global] Cleaning up global listeners');
      registeredRef.current = false;
      
      socket.off('conversation_update', handleConversationUpdate);
      socket.off('conversation_created', handleConversationCreated);
      socket.off('conversation_joined', handleConversationJoined);
      socket.off('conversation_left', handleConversationLeft);
      socket.off('message_recalled', handleMessageRecalledGlobal);
    };
  }, [
    socket, 
    isConnected, 
    user?.uid,
    handleConversationUpdate,
    handleConversationCreated,
    handleConversationJoined,
    handleConversationLeft,
    handleMessageRecalledGlobal, // 🆕 Add to deps
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