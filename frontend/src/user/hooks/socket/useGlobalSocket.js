// frontend/src/hooks/useGlobalSocket.js - WITH GLOBAL MESSAGE UPDATES

import { useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import useChatStore from "../../store/chat/chatStore";

/**
 * 🔥 GLOBAL SOCKET LISTENER - WITH FULL MESSAGE UPDATES
 * 
 * TRÁCH NHIỆM:
 * ✅ Conversation metadata (lastMessage, unread, reorder)
 * ✅ Conversation lifecycle (created, updated)
 * ✅ User-specific events (not message content)
 * ✅ message_recalled (sidebar + messages in store)
 * ✅ message_edited (sidebar + messages in store)
 * ✅ message_deleted (sidebar + messages in store)
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

  // 🔥 CRITICAL FIX: Subscribe to store actions directly
  // This ensures Zustand triggers re-renders when these are called
  const editMessageFromSocket = useChatStore((state) => state.editMessageFromSocket);
  const recallMessageFromSocket = useChatStore((state) => state.recallMessageFromSocket);
  const deleteMessageFromSocket = useChatStore((state) => state.deleteMessageFromSocket);
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

    // 🔥 Use subscribed conversations directly
    const existingConv = conversations.get(conversationId);

    if (existingConv) {
      const existingLastMessage = existingConv.lastMessage;
      const incomingMessageId = lastMessage?.messageId || lastMessage?._id;
      const existingMessageId = existingLastMessage?.messageId || existingLastMessage?._id;
      
      const shouldPreserveRecalled = 
        existingLastMessage?.isRecalled === true &&
        incomingMessageId === existingMessageId;
      
      if (shouldPreserveRecalled) {
        console.log('⏭️ [Global] Preserving recalled lastMessage (same messageId), only updating metadata');
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
  // 🆕 HANDLER: MESSAGE EDITED (GLOBAL - sidebar + messages)
  // ============================================
  const handleMessageEditedGlobal = useCallback((data) => {
    console.log('🔥🔥🔥 [Global] handleMessageEditedGlobal CALLED!', data);
    
    const { conversationId, message } = data;
    
    if (!conversationId || !message) {
      console.warn('⚠️ [Global] Missing data in message_edited');
      return;
    }

    const editedMessageId = message.messageId || message._id;
    const newContent = message.content;
    const editedAt = message.editedAt;

    console.log('✏️ [Global] Message edited:', {
      conversationId,
      messageId: editedMessageId,
      newContent: newContent?.substring(0, 50) + (newContent?.length > 50 ? '...' : ''),
      editedAt,
    });

    console.log('📦 [Global] Store actions available:', {
      hasEditFunction: typeof editMessageFromSocket === 'function',
      hasUpdateFunction: typeof updateConversation === 'function',
      conversationsSize: conversations?.size,
    });
    
    // ============================================
    // 1️⃣ UPDATE MESSAGES IN STORE (for all conversations)
    // ============================================
    console.log('📝 [Global] Updating message in store...');
    
    if (typeof editMessageFromSocket !== 'function') {
      console.error('❌ [Global] editMessageFromSocket is NOT a function!', typeof editMessageFromSocket);
      return;
    }
    
    try {
      editMessageFromSocket(conversationId, editedMessageId, newContent, editedAt);
      console.log('✅ [Global] Message in store updated successfully');
    } catch (error) {
      console.error('❌ [Global] Error updating message in store:', error);
      return;
    }
    
    // ============================================
    // 2️⃣ UPDATE SIDEBAR (only if it's lastMessage)
    // ============================================
    const conversation = conversations.get(conversationId);
    
    if (!conversation?.lastMessage) {
      console.log('⏭️ [Global] No lastMessage in conversation, skip sidebar update');
      return;
    }

    const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
    
    if (lastMessageId === editedMessageId) {
      console.log('🔥 [Global] Edited message IS lastMessage - updating sidebar');
      
      updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          content: newContent,
          editedAt: editedAt,
        },
      });
      
      console.log('✅ [Global] Sidebar updated for edited message');
    } else {
      console.log('⏭️ [Global] Edited message is NOT lastMessage, sidebar not updated');
    }
  }, [editMessageFromSocket, updateConversation, conversations]);

  // ============================================
  // HANDLER: MESSAGE RECALLED (GLOBAL - sidebar + messages)
  // ============================================
  const handleMessageRecalledGlobal = useCallback((data) => {
    console.log('🔥🔥🔥 [Global] handleMessageRecalledGlobal CALLED!', data);
    
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

    console.log('📦 [Global] Store actions available:', {
      hasRecallFunction: typeof recallMessageFromSocket === 'function',
    });
    
    // ============================================
    // 1️⃣ UPDATE MESSAGES IN STORE (for all conversations)
    // ============================================
    console.log('📝 [Global] Updating recalled message in store...');
    
    if (typeof recallMessageFromSocket !== 'function') {
      console.error('❌ [Global] recallMessageFromSocket is NOT a function!', typeof recallMessageFromSocket);
      return;
    }
    
    try {
      recallMessageFromSocket(conversationId, messageId, recalledBy, recalledAt);
      console.log('✅ [Global] Message in store recalled successfully');
    } catch (error) {
      console.error('❌ [Global] Error recalling message in store:', error);
      return;
    }
    
    // ============================================
    // 2️⃣ UPDATE SIDEBAR (only if it's lastMessage)
    // ============================================
    const conversation = conversations.get(conversationId);
    
    if (!conversation?.lastMessage) {
      console.log('⏭️ [Global] No lastMessage in conversation, skip sidebar update');
      return;
    }

    const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
    
    if (lastMessageId === messageId) {
      console.log('🔥 [Global] Recalled message IS lastMessage - updating sidebar');
      
      updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          isRecalled: true,
          content: "",
          recalledAt,
          recalledBy,
        },
      });
      
      console.log('✅ [Global] Sidebar updated for recalled message');
    } else {
      console.log('⏭️ [Global] Recalled message is NOT lastMessage, sidebar not updated');
    }
  }, [recallMessageFromSocket, updateConversation, conversations]);

  // ============================================
  // 🆕 HANDLER: MESSAGE DELETED (GLOBAL - sidebar + messages)
  // ============================================
  const handleMessageDeletedGlobal = useCallback((data) => {
    const { conversationId, messageId } = data;
    
    if (!conversationId || !messageId) {
      console.warn('⚠️ [Global] Missing data in message_deleted');
      return;
    }

    console.log('🗑️ [Global] Message deleted:', {
      conversationId,
      messageId,
    });

    // ============================================
    // 1️⃣ UPDATE MESSAGES IN STORE (for all conversations)
    // ============================================
    console.log('📝 [Global] Deleting message from store...');
    
    if (typeof deleteMessageFromSocket !== 'function') {
      console.error('❌ [Global] deleteMessageFromSocket is NOT a function!');
      return;
    }
    
    try {
      deleteMessageFromSocket(conversationId, messageId);
      console.log('✅ [Global] Message in store deleted successfully');
    } catch (error) {
      console.error('❌ [Global] Error deleting message from store:', error);
      return;
    }
    
    // ============================================
    // 2️⃣ UPDATE SIDEBAR (only if it's lastMessage)
    // ============================================
    const conversation = conversations.get(conversationId);
    
    if (!conversation?.lastMessage) {
      console.log('⏭️ [Global] No lastMessage in conversation, skip sidebar update');
      return;
    }

    const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
    
    if (lastMessageId === messageId) {
      console.log('🔥 [Global] Deleted message IS lastMessage - need to update sidebar');
      console.log('⚠️ [Global] Note: Backend should send conversation_update with new lastMessage');
    } else {
      console.log('⏭️ [Global] Deleted message is NOT lastMessage, sidebar not affected');
    }
  }, [deleteMessageFromSocket, conversations]);

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
    
    // Note: message_received is handled by conversation_update for sidebar
    // and by useChatSocket for active conversation messages

    console.log('✅ [Global] All global listeners registered');

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
    // 🔥 IMPORTANT: Add store subscriptions to deps
    editMessageFromSocket,
    recallMessageFromSocket,
    deleteMessageFromSocket,
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