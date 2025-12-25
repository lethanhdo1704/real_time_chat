import { useEffect, useCallback, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";

export const useChatSocket = ({
  activeConversationId,
  onMessageReceived,
  onMessageEdited,
  onMessageDeleted,
  onTyping,
  onMessageRead,
}) => {
  const { user } = useContext(AuthContext);
  
  // ✅ Use refs to avoid re-registering listeners
  const callbacksRef = useRef({
    onMessageReceived,
    onMessageEdited,
    onMessageDeleted,
    onTyping,
    onMessageRead,
  });

  // ✅ Update refs when callbacks change (no re-register)
  useEffect(() => {
    callbacksRef.current = {
      onMessageReceived,
      onMessageEdited,
      onMessageDeleted,
      onTyping,
      onMessageRead,
    };
  }, [onMessageReceived, onMessageEdited, onMessageDeleted, onTyping, onMessageRead]);

  // ✅ Stable emit functions
  const emitTyping = useCallback((conversationId, isTyping) => {
    if (!conversationId) return;
    socket.emit("typing", { conversationId, isTyping });
  }, []);

  const emitMessageRead = useCallback((conversationId, lastSeenMessage) => {
    if (!conversationId) return;
    socket.emit("message_read", { conversationId, lastSeenMessage });
  }, []);

  // ✅ Register listeners ONCE per conversation
  useEffect(() => {
    if (!activeConversationId) return;

    console.log("💬 [Chat] Registering listeners for:", activeConversationId);

    // ✅ Stable handlers using refs
    const handleMessageReceived = ({ message }) => {
      if (message.conversation !== activeConversationId) return;
      
      console.log("💬 [Chat] Message received:", {
        from: message.sender?.nickname,
        isOwn: message.sender?.uid === user?.uid
      });

      callbacksRef.current.onMessageReceived?.(message);
    };

    const handleMessageEdited = ({ message }) => {
      if (message.conversation !== activeConversationId) return;
      callbacksRef.current.onMessageEdited?.(message);
    };

    const handleMessageDeleted = ({ messageId, conversationId }) => {
      if (conversationId !== activeConversationId) return;
      callbacksRef.current.onMessageDeleted?.(messageId);
    };

    const handleUserTyping = ({ conversationId, user: typingUser, isTyping }) => {
      if (conversationId === activeConversationId) {
        callbacksRef.current.onTyping?.(typingUser, isTyping);
      }
    };

    const handleMessageRead = ({ conversationId, user: readByUser, lastSeenMessage }) => {
      if (conversationId === activeConversationId) {
        callbacksRef.current.onMessageRead?.(readByUser, lastSeenMessage);
      }
    };

    // Register
    socket.on("message_received", handleMessageReceived);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("user_typing", handleUserTyping);
    socket.on("message_read", handleMessageRead);

    // Join room
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
  }, [activeConversationId, user]); // ✅ Only re-run when conversation changes

  return {
    emitTyping,
    emitMessageRead,
  };
};