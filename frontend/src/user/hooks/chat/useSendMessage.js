// frontend/src/hooks/chat/useSendMessage.js
import { useState, useCallback } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import useChatStore from '../../store/chat/chatStore';
import chatApi from '../../services/chatApi';

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
      // ============================================
      // 🔥 FIXED VALIDATION - ALLOW FILE-ONLY MESSAGES
      // ============================================
      
      const hasContent = content?.trim().length > 0;
      const hasAttachments = attachments && attachments.length > 0;

      // Must have either content OR attachments
      if (!hasContent && !hasAttachments) {
        setError('Message content or attachments is required');
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

      // 🔥 Create optimistic message WITH replyTo + attachments
      const optimisticMessage = {
        messageId: clientMessageId,
        clientMessageId,
        conversation: tempConversationId,
        sender: {
          uid: user.uid,
          nickname: user.nickname || user.fullName,
          avatar: user.avatar,
        },
        content: content?.trim() || '', // 🔥 Allow empty content
        type,
        replyTo: replyTo || null,
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

        console.log('📤 [useSendMessage] Sending message:', {
          conversationId: conversationId || 'NEW',
          recipientId,
          clientMessageId,
          hasContent,
          hasAttachments,
          attachmentsCount: attachments?.length || 0,
          hasReply: !!replyTo,
          replyToId: replyTo?.messageId,
        });

        // 🔥 Call API with replyTo + attachments
        const response = await chatApi.sendMessage({
          conversationId,
          recipientId,
          content: content?.trim() || '', // 🔥 Send empty string if no content
          clientMessageId,
          type,
          replyTo: replyTo?.messageId || null,
          attachments: attachments || [],
        });

        const { message: realMessage, conversation: newConversation } = response;

        console.log('✅ [useSendMessage] Message sent:', {
          clientMessageId,
          messageId: realMessage.messageId,
          conversationCreated: !!newConversation,
          hasReply: !!realMessage.replyTo,
          hasAttachments: realMessage.attachments?.length > 0,
        });

        // If conversation was just created
        if (newConversation && !conversationId) {
          // 🔥 CRITICAL FIX: Backend returns conversationId field, NOT _id
          // Backend response: { conversationId: "67a...", type: "private", friend: {...} }
          const actualConversationId = newConversation.conversationId || newConversation._id;
          
          if (!actualConversationId) {
            console.error('❌ [useSendMessage] No conversationId in response:', newConversation);
            throw new Error('Invalid conversation response from server');
          }
          
          console.log('🆕 [useSendMessage] New conversation created:', {
            conversationId: actualConversationId,
            type: newConversation.type,
          });
          
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
          
          // 5️⃣ SET STORE STATE BEFORE NAVIGATE
          console.log('🎯 [useSendMessage] Setting active conversation:', actualConversationId);
          setActiveConversation(actualConversationId);
          setActiveFriend(null);
          
          // 6️⃣ Navigate with validated conversationId
          setTimeout(() => {
            const tab = newConversation.type === 'group' ? 'groups' : 'friends';
            const targetPath = `/${tab}/${actualConversationId}`;
            
            console.log('🔄 [useSendMessage] Navigating to:', targetPath);
            navigate(targetPath, { replace: true });
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
        console.error('❌ [useSendMessage] Failed to send message:', err);

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

      console.log('🔄 [useSendMessage] Retrying message:', {
        failedClientMessageId,
        hasAttachments: attachments?.length > 0,
      });

      // Remove failed message
      const convId = conversationId || 'pending';
      removeOptimisticMessage(failedClientMessageId, convId);

      // Resend with replyTo + attachments
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