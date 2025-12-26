// frontend/src/hooks/chat/useSendMessage.js
import { useState, useCallback } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import useChatStore from '../../store/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useSendMessage Hook
 * 
 * ✅ SUPPORTS LAZY CONVERSATION CREATION:
 * - Can send message even if conversationId is null
 * - Backend creates conversation on first message
 * - Updates local state with new conversationId
 * 
 * ✅ OPTIMISTIC UI WITH clientMessageId:
 * - Generates stable clientMessageId (not tempId)
 * - Backend confirms with same clientMessageId
 * - Prevents duplicates on retry
 * 
 * @returns {Object} { sendMessage, retryMessage, sending, error }
 */
const useSendMessage = () => {
  const { user } = useContext(AuthContext);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const addOptimisticMessage = useChatStore((state) => state.addOptimisticMessage);
  const confirmOptimisticMessage = useChatStore((state) => state.confirmOptimisticMessage);
  const removeOptimisticMessage = useChatStore((state) => state.removeOptimisticMessage);
  const setCurrentConversation = useChatStore((state) => state.setCurrentConversation);

  /**
   * Send a message
   * 
   * @param {string|null} conversationId - Conversation ID (null for first message)
   * @param {string} recipientId - Recipient UID (required if conversationId is null)
   * @param {Object} messageData - Message data
   * @param {string} messageData.content - Message content
   * @param {string} [messageData.type='text'] - Message type
   * @param {string} [messageData.replyTo] - Message ID being replied to
   * @param {Array} [messageData.attachments] - Array of attachments
   * @returns {Promise<Object>} { message, conversation } or null
   */
  const sendMessage = useCallback(
    async (conversationId, recipientId, { content, type = 'text', replyTo, attachments }) => {
      // Validation
      if (!content?.trim()) {
        setError('Message content is required');
        return null;
      }

      if (!conversationId && !recipientId) {
        setError('Either conversationId or recipientId is required');
        return null;
      }

      if (!user) {
        setError('User not authenticated');
        return null;
      }

      // 🔥 Generate STABLE clientMessageId (includes user.uid)
      const clientMessageId = `${user.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use conversationId or 'pending' for optimistic message
      const tempConversationId = conversationId || 'pending';

      // Create optimistic message
      const optimisticMessage = {
        messageId: clientMessageId, // 🔥 Use clientMessageId as temporary messageId
        clientMessageId, // 🔥 Store for backend confirmation
        conversation: tempConversationId,
        sender: {
          uid: user.uid,
          nickname: user.nickname || user.fullName,
          avatar: user.avatar,
        },
        content: content.trim(),
        type,
        replyTo,
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
        _optimistic: true,
        _status: 'sending',
      };

      try {
        setSending(true);
        setError(null);

        // Add optimistic message to UI
        addOptimisticMessage(clientMessageId, optimisticMessage);

        console.log('📤 Sending message:', {
          conversationId: conversationId || 'NEW',
          recipientId,
          clientMessageId,
        });

        // 🔥 Call API with clientMessageId
        const response = await chatApi.sendMessage({
          conversationId, // null or actual ID
          recipientId, // required if conversationId is null
          content: content.trim(),
          clientMessageId, // 🔥 Send clientMessageId to backend
          type,
          replyTo,
          attachments,
        });

        const { message: realMessage, conversation: newConversation } = response;

        console.log('✅ Message sent:', {
          clientMessageId,
          messageId: realMessage.messageId,
          conversationCreated: !!newConversation,
        });

        // If conversation was just created, update store
        if (newConversation && !conversationId) {
          console.log('🆕 New conversation created:', newConversation._id);
          setCurrentConversation(newConversation);

          // 🔥 Move message from 'pending' to actual conversationId
          const actualConversationId = newConversation._id;
          
          // Remove from 'pending'
          removeOptimisticMessage(clientMessageId, 'pending');
          
          // Confirm in actual conversation
          confirmOptimisticMessage(actualConversationId, clientMessageId, {
            ...realMessage,
            conversation: actualConversationId,
            _status: 'sent',
          });
        } else {
          // 🔥 Confirm optimistic message by clientMessageId
          confirmOptimisticMessage(tempConversationId, clientMessageId, {
            ...realMessage,
            _status: 'sent',
          });
        }

        return {
          message: realMessage,
          conversation: newConversation || null,
        };

      } catch (err) {
        console.error('❌ Failed to send message:', err);

        // Mark as failed (keep in UI with retry option)
        confirmOptimisticMessage(tempConversationId, clientMessageId, {
          ...optimisticMessage,
          _status: 'failed',
          _error: err.response?.data?.message || err.message || 'Failed to send',
        });

        const errorMessage = err.response?.data?.message || err.message || 'Failed to send message';
        setError(errorMessage);

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
      setCurrentConversation,
    ]
  );

  /**
   * Retry failed message
   * 🔥 Removes failed message and resends with NEW clientMessageId
   * 
   * @param {string} failedClientMessageId - Failed message's clientMessageId
   * @param {Object} messageData - Original message data
   */
  const retryMessage = useCallback(
    async (failedClientMessageId, messageData) => {
      const { conversationId, recipientId, content, type, replyTo, attachments } = messageData;

      console.log('🔄 Retrying message:', failedClientMessageId);

      // Remove failed message
      const convId = conversationId || 'pending';
      removeOptimisticMessage(failedClientMessageId, convId);

      // Resend (will generate NEW clientMessageId)
      return sendMessage(conversationId, recipientId, {
        content,
        type,
        replyTo,
        attachments,
      });
    },
    [sendMessage, removeOptimisticMessage]
  );

  return {
    sendMessage,
    retryMessage,
    sending,
    error,
  };
};

export default useSendMessage;