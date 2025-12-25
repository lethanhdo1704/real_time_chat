// frontend/src/hooks/chat/useSendMessage.js
import { useState, useCallback } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import useChatStore from '../../store/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useSendMessage Hook
 * 
 * Handles sending messages with optimistic UI:
 * 1. Add optimistic message to UI immediately (with tempId)
 * 2. Call API to send message
 * 3. On success: Replace tempId with real _id from backend
 * 4. On error: Remove optimistic message + show error
 * 
 * Features:
 * - Optimistic updates for instant UX
 * - Error handling with rollback
 * - Support for text, images, files
 * - Support for reply
 * 
 * @returns {Object} { sendMessage, sending, error }
 */
const useSendMessage = () => {
  const { user } = useContext(AuthContext);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const addOptimisticMessage = useChatStore((state) => state.addOptimisticMessage);
  const confirmOptimisticMessage = useChatStore((state) => state.confirmOptimisticMessage);
  const removeOptimisticMessage = useChatStore((state) => state.removeOptimisticMessage);

  /**
   * Send a message
   * 
   * @param {string} conversationId - Conversation ID
   * @param {Object} messageData - Message data
   * @param {string} messageData.content - Message content
   * @param {string} [messageData.type='text'] - Message type
   * @param {string} [messageData.replyTo] - Message ID being replied to
   * @param {Array} [messageData.attachments] - Array of attachments
   */
  const sendMessage = useCallback(
    async (conversationId, { content, type = 'text', replyTo, attachments }) => {
      if (!conversationId || !content?.trim()) {
        setError('Message content is required');
        return;
      }

      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Generate temporary ID
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create optimistic message
      const optimisticMessage = {
        _id: tempId,
        conversation: conversationId,
        sender: {
          _id: user.uid,
          uid: user.uid,
          fullName: user.fullName,
          avatar: user.avatar,
        },
        content: content.trim(),
        type,
        replyTo,
        attachments,
        createdAt: new Date().toISOString(),
        // Flag for UI to show as "sending"
        _optimistic: true,
      };

      try {
        setSending(true);
        setError(null);

        // Add optimistic message to UI
        addOptimisticMessage(tempId, optimisticMessage);

        // Call API
        const response = await chatApi.sendMessage(conversationId, {
          content: content.trim(),
          type,
          replyTo,
          attachments,
        });

        // Confirm optimistic message with real data
        confirmOptimisticMessage(tempId, response.message);

        console.log('✅ Message sent successfully:', response.message);
      } catch (err) {
        console.error('❌ Failed to send message:', err);

        // Remove optimistic message on error
        removeOptimisticMessage(tempId, conversationId);

        // Set error
        const errorMessage = err.message || 'Failed to send message';
        setError(errorMessage);

        // Re-throw for component to handle (e.g., show toast)
        throw new Error(errorMessage);
      } finally {
        setSending(false);
      }
    },
    [
      user,
      addOptimisticMessage,
      confirmOptimisticMessage,
      removeOptimisticMessage,
    ]
  );

  return {
    sendMessage,
    sending,
    error,
  };
};

export default useSendMessage;