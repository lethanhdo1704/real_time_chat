// frontend/src/hooks/socket/useGlobalSocket.js - WITH REACTIONS

import { useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import useChatStore from "../../store/chat/chatStore";

/**
 * 🔥 GLOBAL SOCKET LISTENER - WITH REACTIONS
 * 
 * TRÁCH NHIỆM:
 * ✅ Conversation metadata (lastMessage, unread, reorder)
 * ✅ Conversation lifecycle (created, updated)
 * ✅ User-specific events (not message content)
 * ✅ message_recalled (sidebar + messages in store)
 * ✅ message_edited (sidebar + messages in store)
 * ✅ message_deleted (sidebar + messages in store)
 * ✅ 🆕 message:reaction:update (reactions for all conversations)
 * 
 * NGUYÊN TẮC:
 * - Register ONCE per connection
 * - Use SocketContext (consistent pattern)
 * - Stable handlers (useCallback)
 * - Update BOTH sidebar AND message store
 */
export const useGlobalSocket = ({ 
  onConversationUpdate,
  onConversationCreated 
}) => {
  const { user } = useContext(AuthContext);
  const { socket, isConnected } = useContext(SocketContext);
  const registeredRef = useRef(false);

  // 🔥 Subscribe to store actions
  const editMessageFromSocket = useChatStore((state) => state.editMessageFromSocket);
  const recallMessageFromSocket = useChatStore((state) => state.recallMessageFromSocket);
  const deleteMessageFromSocket = useChatStore((state) => state.deleteMessageFromSocket);
  const setReactionsFinal = useChatStore((state) => state.setReactionsFinal);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const conversations = useChatStore((state) => state.conversations);

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

    const existingConv = conversations.get(conversationId);

    if (existingConv) {
      const existingLastMessage = existingConv.lastMessage;
      const incomingMessageId = lastMessage?.messageId || lastMessage?._id;
      const existingMessageId = existingLastMessage?.messageId || existingLastMessage?._id;
      
      const shouldPreserveRecalled = 
        existingLastMessage?.isRecalled === true &&
        incomingMessageId === existingMessageId;
      
      if (shouldPreserveRecalled) {
        console.log('⏭️ [Global] Preserving recalled lastMessage');
        updateConversation(conversationId, {
          lastMessageAt,
          unreadCount,
        });
      } else {
        updateConversation(conversationId, {
          lastMessage,
          lastMessageAt,
          unreadCount,
        });
      }
    } else {
      console.log('🆕 [Global] Adding new conversation:', conversationId);
      const { addConversation } = useChatStore.getState();
      addConversation({
        _id: conversationId,
        conversationId,
        lastMessage,
        lastMessageAt,
        unreadCount,
      });
    }

    if (onConversationUpdate) {
      onConversationUpdate(data);
    }
  }, [onConversationUpdate, conversations, updateConversation]);

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

    if (onConversationCreated) {
      onConversationCreated(data);
    }
  }, [onConversationCreated]);

  // ============================================
  // HANDLER: CONVERSATION JOINED
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
  // HANDLER: CONVERSATION LEFT
  // ============================================
  const handleConversationLeft = useCallback((data) => {
    const { conversationId, reason } = data;
    
    console.log('👋 [Global] Left conversation:', conversationId, 'reason:', reason);

    const { removeConversation, setActiveConversation, activeConversationId } = useChatStore.getState();
    
    removeConversation(conversationId);
    
    if (activeConversationId === conversationId) {
      setActiveConversation(null);
    }
  }, []);

  // ============================================
  // HANDLER: MESSAGE EDITED (GLOBAL)
  // ============================================
  const handleMessageEditedGlobal = useCallback((data) => {
    console.log('✏️ [Global] message_edited:', data);
    
    const { conversationId, message } = data;
    
    if (!conversationId || !message) {
      console.warn('⚠️ [Global] Missing data in message_edited');
      return;
    }

    const editedMessageId = message.messageId || message._id;
    const newContent = message.content;
    const editedAt = message.editedAt;

    console.log('📝 [Global] Updating edited message in store');
    
    if (typeof editMessageFromSocket !== 'function') {
      console.error('❌ [Global] editMessageFromSocket not available');
      return;
    }
    
    try {
      editMessageFromSocket(conversationId, editedMessageId, newContent, editedAt);
      console.log('✅ [Global] Message edited in store');
    } catch (error) {
      console.error('❌ [Global] Error editing message:', error);
      return;
    }
    
    // Update sidebar if it's lastMessage
    const conversation = conversations.get(conversationId);
    
    if (!conversation?.lastMessage) return;

    const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
    
    if (lastMessageId === editedMessageId) {
      console.log('🔥 [Global] Updating sidebar for edited lastMessage');
      
      updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          content: newContent,
          editedAt: editedAt,
        },
      });
    }
  }, [editMessageFromSocket, updateConversation, conversations]);

  // ============================================
  // HANDLER: MESSAGE RECALLED (GLOBAL)
  // ============================================
  const handleMessageRecalledGlobal = useCallback((data) => {
    console.log('↩️ [Global] message_recalled:', data);
    
    const { conversationId, messageId, recalledBy, recalledAt } = data;
    
    if (!conversationId || !messageId) {
      console.warn('⚠️ [Global] Missing data in message_recalled');
      return;
    }

    console.log('📝 [Global] Recalling message in store');
    
    if (typeof recallMessageFromSocket !== 'function') {
      console.error('❌ [Global] recallMessageFromSocket not available');
      return;
    }
    
    try {
      recallMessageFromSocket(conversationId, messageId, recalledBy, recalledAt);
      console.log('✅ [Global] Message recalled in store');
    } catch (error) {
      console.error('❌ [Global] Error recalling message:', error);
      return;
    }
    
    // Update sidebar if it's lastMessage
    const conversation = conversations.get(conversationId);
    
    if (!conversation?.lastMessage) return;

    const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
    
    if (lastMessageId === messageId) {
      console.log('🔥 [Global] Updating sidebar for recalled lastMessage');
      
      updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          isRecalled: true,
          content: "",
          recalledAt,
          recalledBy,
        },
      });
    }
  }, [recallMessageFromSocket, updateConversation, conversations]);

  // ============================================
  // HANDLER: MESSAGE DELETED (GLOBAL)
  // ============================================
  const handleMessageDeletedGlobal = useCallback((data) => {
    const { conversationId, messageId } = data;
    
    if (!conversationId || !messageId) {
      console.warn('⚠️ [Global] Missing data in message_deleted');
      return;
    }

    console.log('🗑️ [Global] Deleting message from store');
    
    if (typeof deleteMessageFromSocket !== 'function') {
      console.error('❌ [Global] deleteMessageFromSocket not available');
      return;
    }
    
    try {
      deleteMessageFromSocket(conversationId, messageId);
      console.log('✅ [Global] Message deleted from store');
    } catch (error) {
      console.error('❌ [Global] Error deleting message:', error);
    }
  }, [deleteMessageFromSocket]);

  // ============================================
  // 🆕 HANDLER: REACTION UPDATE (GLOBAL)
  // ============================================
  /**
   * Handle reaction updates from backend
   * Backend sends FINAL STATE after toggle operation
   * This overwrites any optimistic updates
   */
  const handleReactionUpdateGlobal = useCallback((data) => {
    console.log('🎭 [Global] message:reaction:update:', data);
    
    const { conversationId, messageId, reactions } = data;
    
    if (!conversationId || !messageId || !Array.isArray(reactions)) {
      console.warn('⚠️ [Global] Invalid reaction update data:', data);
      return;
    }

    console.log('📝 [Global] Updating reactions in store:', {
      conversationId,
      messageId,
      reactionsCount: reactions.length,
    });
    
    if (typeof setReactionsFinal !== 'function') {
      console.error('❌ [Global] setReactionsFinal not available');
      return;
    }
    
    try {
      // 🔥 Overwrite optimistic state with server truth
      setReactionsFinal(conversationId, messageId, reactions);
      console.log('✅ [Global] Reactions updated in store');
    } catch (error) {
      console.error('❌ [Global] Error updating reactions:', error);
    }
  }, [setReactionsFinal]);

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
    // ✅ MESSAGE EVENTS (for both sidebar + message store)
    // ============================================
    socket.on('message_edited', handleMessageEditedGlobal);
    socket.on('message_recalled', handleMessageRecalledGlobal);
    socket.on('message_deleted', handleMessageDeletedGlobal);
    
    // ============================================
    // 🆕 REACTION EVENTS
    // ============================================
    socket.on('message:reaction:update', handleReactionUpdateGlobal);

    console.log('✅ [Global] All global listeners registered (including reactions)');

    return () => {
      console.log('🌍 [Global] Cleaning up global listeners');
      registeredRef.current = false;
      
      socket.off('conversation_update', handleConversationUpdate);
      socket.off('conversation_created', handleConversationCreated);
      socket.off('conversation_joined', handleConversationJoined);
      socket.off('conversation_left', handleConversationLeft);
      socket.off('message_edited', handleMessageEditedGlobal);
      socket.off('message_recalled', handleMessageRecalledGlobal);
      socket.off('message_deleted', handleMessageDeletedGlobal);
      socket.off('message:reaction:update', handleReactionUpdateGlobal);
    };
  }, [
    socket, 
    isConnected, 
    user?.uid,
    handleConversationUpdate,
    handleConversationCreated,
    handleConversationJoined,
    handleConversationLeft,
    handleMessageEditedGlobal,
    handleMessageRecalledGlobal,
    handleMessageDeletedGlobal,
    handleReactionUpdateGlobal,
    editMessageFromSocket,
    recallMessageFromSocket,
    deleteMessageFromSocket,
    setReactionsFinal,
    updateConversation,
    conversations,
  ]);

  // Reset registration flag on disconnect
  useEffect(() => {
    if (!isConnected) {
      registeredRef.current = false;
    }
  }, [isConnected]);

  return null;
};

export default useGlobalSocket;