// frontend/src/hooks/chat/useChatSocket.js
import { useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getSocket } from "../../services/socketService";

/**
 * Chat socket hook - Manages chat-specific socket events
 * 
 * @param {Object} params
 * @param {string} params.activeConversationId - Current conversation ID
 * @param {Function} params.onMessageReceived - Callback for new messages
 * @param {Function} params.onMessageEdited - Callback for edited messages
 * @param {Function} params.onMessageDeleted - Callback for deleted messages
 * @param {Function} params.onTyping - Callback for typing indicators
 * @param {Function} params.onMessageRead - Callback for read receipts
 */
export const useChatSocket = ({
  activeConversationId,
  onMessageReceived,
  onMessageEdited,
  onMessageDeleted,
  onTyping,
  onMessageRead,
}) => {
  const { user } = useContext(AuthContext);

  // ============================================
  // EMIT FUNCTIONS
  // ============================================

  const emitTyping = useCallback((conversationId, isTyping) => {
    const socket = getSocket();
    if (!socket || !conversationId) return;
    
    socket.emit("typing", { conversationId, isTyping });
  }, []);

  const emitMessageRead = useCallback((conversationId, lastSeenMessage) => {
    const socket = getSocket();
    if (!socket || !conversationId) return;
    
    socket.emit("message_read", { conversationId, lastSeenMessage });
  }, []);

  // ============================================
  // SOCKET LISTENERS
  // ============================================

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !activeConversationId) return;

    console.log("💬 [Chat] Setting up listeners for:", activeConversationId);

    // ✅ Stable handlers
    const handleMessageReceived = ({ message }) => {
      if (message.conversation !== activeConversationId) return;
      
      console.log("💬 [Chat] Message received:", {
        from: message.sender?.nickname,
        isOwn: message.sender?.uid === user?.uid
      });

      onMessageReceived?.(message);
    };

    const handleMessageEdited = ({ message }) => {
      if (message.conversation !== activeConversationId) return;
      onMessageEdited?.(message);
    };

    const handleMessageDeleted = ({ messageId, conversationId }) => {
      if (conversationId !== activeConversationId) return;
      onMessageDeleted?.(messageId);
    };

    const handleUserTyping = ({ conversationId, user: typingUser, isTyping }) => {
      if (conversationId === activeConversationId) {
        onTyping?.(typingUser, isTyping);
      }
    };

    const handleMessageRead = ({ conversationId, user: readByUser, lastSeenMessage }) => {
      if (conversationId === activeConversationId) {
        onMessageRead?.(readByUser, lastSeenMessage);
      }
    };

    // Register listeners
    socket.on("message_received", handleMessageReceived);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("user_typing", handleUserTyping);
    socket.on("message_read", handleMessageRead);

    // Join conversation room
    socket.emit("join_conversation", { conversationId: activeConversationId });

    // Cleanup
    return () => {
      socket.off("message_received", handleMessageReceived);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("user_typing", handleUserTyping);
      socket.off("message_read", handleMessageRead);
      
      socket.emit("leave_conversation", { conversationId: activeConversationId });
      console.log("💬 [Chat] Cleaned up for:", activeConversationId);
    };
  }, [
    activeConversationId,
    user,
    onMessageReceived,
    onMessageEdited,
    onMessageDeleted,
    onTyping,
    onMessageRead
  ]);

  return {
    emitTyping,
    emitMessageRead,
  };
};