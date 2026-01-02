// frontend/src/hooks/chat/useChatSocket.js
import { useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getSocket } from "../../services/socketService";
import useChatStore from "../../store/chat/chatStore";

/**
 * Chat socket hook - WITH MESSAGE DELETION EVENTS
 * 
 * @param {Object} params
 * @param {string} params.activeConversationId - Current conversation ID
 * @param {Function} params.onMessageReceived - Callback for new messages
 * @param {Function} params.onMessageEdited - Callback for edited messages
 * @param {Function} params.onMessageDeleted - Callback for deleted messages (admin)
 * @param {Function} params.onMessageRecalled - 🆕 Callback for recalled messages
 * @param {Function} params.onTyping - Callback for typing indicators
 * @param {Function} params.onMessageRead - Callback for read receipts
 */
export const useChatSocket = ({
  activeConversationId,
  onMessageReceived,
  onMessageEdited,
  onMessageDeleted,
  onMessageRecalled, // 🆕 NEW
  onTyping,
  onMessageRead,
}) => {
  const { user } = useContext(AuthContext);
  
  // 🆕 Get store actions for message deletion
  const recallMessageFromSocket = useChatStore((state) => state.recallMessageFromSocket);
  const deleteMessageFromSocket = useChatStore((state) => state.deleteMessageFromSocket);

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

    // ✅ Message received handler
    const handleMessageReceived = (data) => {
      console.log("🔥 [DEBUG] message_received:", data);
      
      const { message } = data;
      
      if (!message) {
        console.error("❌ [DEBUG] No message in data");
        return;
      }
      
      if (message.conversation !== activeConversationId) {
        console.warn("⚠️ [DEBUG] Message for different conversation");
        return;
      }
      
      console.log("✅ [DEBUG] Processing message:", {
        messageId: message.messageId,
        from: message.sender?.nickname,
        isOwn: message.sender?.uid === user?.uid,
      });

      if (onMessageReceived) {
        onMessageReceived(message);
      }
    };

    // ✅ Message edited handler
    const handleMessageEdited = (data) => {
      console.log("🔥 [DEBUG] message_edited:", data);
      const { message } = data;
      if (message?.conversation !== activeConversationId) return;
      onMessageEdited?.(message);
    };

    // ✅ Message deleted handler (admin delete - PRIORITY 1)
    const handleMessageDeleted = (data) => {
      console.log("🔥 [DEBUG] message_deleted:", data);
      const { messageId, conversationId } = data;
      
      if (conversationId !== activeConversationId) return;
      
      // Update Redux store
      deleteMessageFromSocket(conversationId, messageId);
      
      // Call callback if provided
      onMessageDeleted?.(messageId);
    };

    // 🆕 Message recalled handler (PRIORITY 2)
    const handleMessageRecalled = (data) => {
      console.log("🔥 [DEBUG] message_recalled:", data);
      const { conversationId, messageId, recalledBy, recalledAt } = data;
      
      if (conversationId !== activeConversationId) return;
      
      // Update Redux store
      recallMessageFromSocket(conversationId, messageId, recalledBy, recalledAt);
      
      // Call callback if provided
      onMessageRecalled?.(data);
    };

    // ✅ Typing indicator handler
    const handleUserTyping = (data) => {
      console.log("🔥 [DEBUG] user_typing:", data);
      const { conversationId, user: typingUser, isTyping } = data;
      if (conversationId === activeConversationId) {
        onTyping?.(typingUser, isTyping);
      }
    };

    // ✅ Message read handler
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
    socket.on("message_recalled", handleMessageRecalled); // 🆕 NEW
    socket.on("user_typing", handleUserTyping);
    socket.on("message_read", handleMessageRead);
    console.log("✅ [DEBUG] All listeners registered");

    // Join conversation room
    console.log("📥 [DEBUG] Emitting join_conversation:", activeConversationId);
    socket.emit("join_conversation", { conversationId: activeConversationId });

    // Cleanup
    return () => {
      console.log("🧹 [DEBUG] Cleaning up listeners for:", activeConversationId);
      
      socket.off("message_received", handleMessageReceived);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_recalled", handleMessageRecalled); // 🆕 NEW
      socket.off("user_typing", handleUserTyping);
      socket.off("message_read", handleMessageRead);
      
      socket.emit("leave_conversation", { conversationId: activeConversationId });
      console.log("💬 [DEBUG] Cleaned up for:", activeConversationId);
    };
  }, [
    activeConversationId,
    user,
    onMessageReceived,
    onMessageEdited,
    onMessageDeleted,
    onMessageRecalled, // 🆕 NEW
    onTyping,
    onMessageRead,
    recallMessageFromSocket, // 🆕 Store action
    deleteMessageFromSocket, // 🆕 Store action
  ]);

  return {
    emitTyping,
    emitMessageRead,
  };
};