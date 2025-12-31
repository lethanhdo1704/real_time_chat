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
    
    if (!socket) {
      console.warn("⚠️ [useChatSocket] Socket not available");
      return;
    }
    
    if (!activeConversationId) {
      console.warn("⚠️ [useChatSocket] No activeConversationId");
      return;
    }

    console.log("💬 [useChatSocket] Setting up listeners for:", activeConversationId);

    // 🔥 DEBUG: Test if socket can receive ANY event
    const testHandler = (eventName) => (data) => {
      console.log(`🔥 [DEBUG] Event "${eventName}" received:`, data);
    };

    // ✅ Message received handler with full debug
    const handleMessageReceived = (data) => {
      console.log("🔥 [DEBUG] message_received RAW data:", data);
      
      // Check data structure
      if (!data) {
        console.error("❌ [DEBUG] No data received");
        return;
      }
      
      const { message, conversationUpdate } = data;
      
      if (!message) {
        console.error("❌ [DEBUG] No message in data:", data);
        return;
      }
      
      console.log("🔥 [DEBUG] Message conversation:", message.conversation);
      console.log("🔥 [DEBUG] Active conversation:", activeConversationId);
      console.log("🔥 [DEBUG] Match:", message.conversation === activeConversationId);
      
      if (message.conversation !== activeConversationId) {
        console.warn("⚠️ [DEBUG] Message for different conversation");
        console.log("   Expected:", activeConversationId);
        console.log("   Got:", message.conversation);
        return;
      }
      
      console.log("✅ [DEBUG] Processing message:", {
        messageId: message.messageId,
        from: message.sender?.nickname,
        isOwn: message.sender?.uid === user?.uid,
        content: message.content
      });

      if (onMessageReceived) {
        console.log("✅ [DEBUG] Calling onMessageReceived callback");
        onMessageReceived(message);
      } else {
        console.warn("⚠️ [DEBUG] onMessageReceived callback is null/undefined");
      }
    };

    const handleMessageEdited = (data) => {
      console.log("🔥 [DEBUG] message_edited:", data);
      const { message } = data;
      if (message?.conversation !== activeConversationId) return;
      onMessageEdited?.(message);
    };

    const handleMessageDeleted = (data) => {
      console.log("🔥 [DEBUG] message_deleted:", data);
      const { messageId, conversationId } = data;
      if (conversationId !== activeConversationId) return;
      onMessageDeleted?.(messageId);
    };

    const handleUserTyping = (data) => {
      console.log("🔥 [DEBUG] user_typing:", data);
      const { conversationId, user: typingUser, isTyping } = data;
      if (conversationId === activeConversationId) {
        onTyping?.(typingUser, isTyping);
      }
    };

    const handleMessageRead = (data) => {
      console.log("🔥 [DEBUG] message_read:", data);
      const { conversationId, user: readByUser, lastSeenMessage } = data;
      if (conversationId === activeConversationId) {
        onMessageRead?.(readByUser, lastSeenMessage);
      }
    };

    // Register ALL listeners
    console.log("📝 [DEBUG] Registering socket listeners...");
    socket.on("message_received", handleMessageReceived);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("user_typing", handleUserTyping);
    socket.on("message_read", handleMessageRead);
    console.log("✅ [DEBUG] All listeners registered");

    // Join conversation room
    console.log("📥 [DEBUG] Emitting join_conversation:", activeConversationId);
    socket.emit("join_conversation", { conversationId: activeConversationId });

    // Test: Listen to ANY event
    socket.onAny((eventName, ...args) => {
      if (eventName.startsWith('message') || eventName.startsWith('user')) {
        console.log(`🌐 [DEBUG] ANY EVENT: "${eventName}"`, args);
      }
    });

    // Cleanup
    return () => {
      console.log("🧹 [DEBUG] Cleaning up listeners for:", activeConversationId);
      
      socket.off("message_received", handleMessageReceived);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("user_typing", handleUserTyping);
      socket.off("message_read", handleMessageRead);
      socket.offAny();
      
      socket.emit("leave_conversation", { conversationId: activeConversationId });
      console.log("💬 [DEBUG] Cleaned up for:", activeConversationId);
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