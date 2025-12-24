import { useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";

export const useChatSocket = ({
  activeConversationId,
  onMessageReceived,
  onTyping,
  onMessageRead,
}) => {
  const { user } = useContext(AuthContext);

  const joinConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    console.log('💬 [Chat] Joining conversation:', conversationId);
    socket.emit('join_conversation', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    console.log('💬 [Chat] Leaving conversation:', conversationId);
    socket.emit('leave_conversation', { conversationId });
  }, []);

  const emitTyping = useCallback((conversationId, isTyping) => {
    if (!conversationId) return;
    socket.emit('typing', { conversationId, isTyping });
  }, []);

  const emitMessageRead = useCallback((conversationId, lastSeenMessage) => {
    if (!conversationId) return;
    socket.emit('message_read', { conversationId, lastSeenMessage });
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;

    const handleMessageReceived = ({ message }) => {
      // ✅ ONLY process if it's for the active conversation
      if (message.conversation !== activeConversationId) {
        return;
      }

      console.log('💬 [Chat] Message for active conversation:', {
        conversationId: message.conversation,
        from: message.sender?.nickname,
        isOwnMessage: message.sender?.uid === user?.uid
      });
      
      if (onMessageReceived) {
        onMessageReceived(message);
      }
    };

    const handleUserTyping = ({ conversationId, user: typingUser, isTyping }) => {
      if (conversationId === activeConversationId && onTyping) {
        onTyping(typingUser, isTyping);
      }
    };

    const handleMessageRead = ({ conversationId, user: readByUser, lastSeenMessage }) => {
      if (conversationId === activeConversationId && onMessageRead) {
        onMessageRead(readByUser, lastSeenMessage);
      }
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_read', handleMessageRead);
    console.log('💬 [Chat] Listeners registered for:', activeConversationId);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_read', handleMessageRead);
      console.log('💬 [Chat] Listeners cleaned up for:', activeConversationId);
    };
  }, [activeConversationId, onMessageReceived, onTyping, onMessageRead, user]);

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