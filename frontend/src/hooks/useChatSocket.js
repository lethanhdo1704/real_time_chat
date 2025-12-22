// frontend/src/hooks/useChatSocket.js
import { useEffect, useCallback } from "react";
import socket from "../socket";

/**
 * Custom hook để quản lý socket events cho chat
 * Centralize tất cả socket event handling
 * 
 * @param {Object} params
 * @param {string} params.activeConversationId - ID của conversation đang active
 * @param {Function} params.onMessageReceived - Callback khi nhận message mới
 * @param {Function} params.onTyping - Callback khi user typing
 * @param {Function} params.onMessageRead - Callback khi message được đọc
 * @param {Function} params.onUpdateSidebar - Callback để update sidebar (last message)
 */
export const useChatSocket = ({
  activeConversationId,
  onMessageReceived,
  onTyping,
  onMessageRead,
  onUpdateSidebar,
}) => {
  /**
   * Join conversation room
   */
  const joinConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    
    socket.emit('join_conversation', { conversationId });
  }, []);

  /**
   * Leave conversation room
   */
  const leaveConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    
    socket.emit('leave_conversation', { conversationId });
  }, []);

  /**
   * Emit typing event
   */
  const emitTyping = useCallback((conversationId, isTyping) => {
    if (!conversationId) return;
    
    socket.emit('typing', { conversationId, isTyping });
  }, []);

  /**
   * Emit message read event
   */
  const emitMessageRead = useCallback((conversationId, lastSeenMessage) => {
    if (!conversationId) return;
    
    socket.emit('message_read', { conversationId, lastSeenMessage });
  }, []);

  /**
   * Setup socket listeners
   */
  useEffect(() => {
    // Listen for new messages
    const handleMessageReceived = ({ message }) => {
      const isActiveConversation = message.conversation === activeConversationId;
      
      // Always update sidebar with last message
      if (onUpdateSidebar) {
        onUpdateSidebar(message.conversation, {
          messageId: message.messageId,
          content: message.content,
          type: message.type,
          sender: message.sender,
          createdAt: message.createdAt,
        });
      }
      
      // Only append to chat window if it's the active conversation
      if (isActiveConversation && onMessageReceived) {
        onMessageReceived(message);
      }
    };

    // Listen for typing indicator
    const handleUserTyping = ({ conversationId, user, isTyping }) => {
      if (conversationId === activeConversationId && onTyping) {
        onTyping(user, isTyping);
      }
    };

    // Listen for read receipts
    const handleMessageRead = ({ conversationId, user, lastSeenMessage }) => {
      if (conversationId === activeConversationId && onMessageRead) {
        onMessageRead(user, lastSeenMessage);
      }
    };

    // Register listeners
    socket.on('message_received', handleMessageReceived);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_read', handleMessageRead);

    // Cleanup
    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_read', handleMessageRead);
    };
  }, [activeConversationId, onMessageReceived, onTyping, onMessageRead, onUpdateSidebar]);

  /**
   * Auto join/leave conversation when activeConversationId changes
   */
  useEffect(() => {
    if (!activeConversationId) return;

    joinConversation(activeConversationId);

    return () => {
      leaveConversation(activeConversationId);
    };
  }, [activeConversationId, joinConversation, leaveConversation]);

  return {
    joinConversation,
    leaveConversation,
    emitTyping,
    emitMessageRead,
  };
};