// frontend/src/hooks/chat/useSendMessage.js
import { useState, useCallback } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import useChatStore from '../../store/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useSendMessage Hook
 * 
 * ✅ FINAL FIX (v2):
 * - SET activeConversation IMMEDIATELY after creating new conversation
 * - SET activeFriend to null to exit lazy mode
 * - THEN navigate (UI will already be in correct state)
 */
const useSendMessage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const addOptimisticMessage = useChatStore((state) => state.addOptimisticMessage);
  const confirmOptimisticMessage = useChatStore((state) => state.confirmOptimisticMessage);
  const removeOptimisticMessage = useChatStore((state) => state.removeOptimisticMessage);
  const addConversation = useChatStore((state) => state.addConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setActiveFriend = useChatStore((state) => state.setActiveFriend);
  const ensureConversationMessages = useChatStore((state) => state.ensureConversationMessages);

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

      // Generate STABLE clientMessageId
      const clientMessageId = `${user.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempConversationId = conversationId || 'pending';

      // Create optimistic message
      const optimisticMessage = {
        messageId: clientMessageId,
        clientMessageId,
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

        // Call API with clientMessageId
        const response = await chatApi.sendMessage({
          conversationId,
          recipientId,
          content: content.trim(),
          clientMessageId,
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

        // 🔥 FIX: If conversation was just created
        if (newConversation && !conversationId) {
          console.log('🆕 New conversation created:', newConversation._id);
          
          const actualConversationId = newConversation._id;
          
          // 1️⃣ Add conversation to store
          addConversation(newConversation);
          
          // 2️⃣ Ensure messages array exists
          ensureConversationMessages(actualConversationId);
          
          // 3️⃣ Move message from 'pending' to actual conversationId
          removeOptimisticMessage(clientMessageId, 'pending');
          
          // 4️⃣ Confirm in actual conversation
          confirmOptimisticMessage(actualConversationId, clientMessageId, {
            ...realMessage,
            conversation: actualConversationId,
            _status: 'sent',
          });
          
          // 🔥 5️⃣ SET STORE STATE BEFORE NAVIGATE
          console.log('🎯 Setting active conversation:', actualConversationId);
          setActiveConversation(actualConversationId);
          setActiveFriend(null); // Clear lazy mode
          
          // 6️⃣ Navigate (UI already in correct state)
          setTimeout(() => {
            const tab = newConversation.type === 'group' ? 'groups' : 'friends';
            navigate(`/${tab}/${actualConversationId}`, { replace: true });
            console.log('🔄 Navigated to new conversation:', actualConversationId);
          }, 50);
          
        } else {
          // Existing conversation - just confirm
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

        // Mark as failed
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
      navigate,
      addOptimisticMessage,
      confirmOptimisticMessage,
      removeOptimisticMessage,
      addConversation,
      setActiveConversation,
      setActiveFriend,
      ensureConversationMessages,
    ]
  );

  const retryMessage = useCallback(
    async (failedClientMessageId, messageData) => {
      const { conversationId, recipientId, content, type, replyTo, attachments } = messageData;

      console.log('🔄 Retrying message:', failedClientMessageId);

      // Remove failed message
      const convId = conversationId || 'pending';
      removeOptimisticMessage(failedClientMessageId, convId);

      // Resend
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