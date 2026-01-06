// frontend/src/hooks/chat/useChatSocket.js
import { useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getSocket } from "../../services/socketService";

/**
 * Chat socket hook - ACTIVE CONVERSATION ONLY
 * 
 * 🔥 UPDATED: Only handles events for the ACTIVE conversation
 * Global updates (edit/recall/delete for ALL conversations) are handled by useGlobalSocket
 * 
 * Handles real-time events for ACTIVE conversation:
 * - message_received: New messages
 * - user_typing: Typing indicators
 * - message_read_receipt: Read receipts with avatars
 * 
 * NOTE: message_edited, message_recalled, message_deleted are handled globally
 * by useGlobalSocket to ensure cross-conversation updates work properly
 * 
 * @param {Object} params
 * @param {string} params.activeConversationId - Current conversation ID
 * @param {Function} params.onMessageReceived - Callback for new messages
 * @param {Function} params.onMessageEdited - Callback for edited messages (active conversation only)
 * @param {Function} params.onMessageDeleted - Callback for deleted messages (active conversation only)
 * @param {Function} params.onMessageRecalled - Callback for recalled messages (active conversation only)
 * @param {Function} params.onTyping - Callback for typing indicators
 * @param {Function} params.onReadReceipt - Callback for read receipts
 */
export const useChatSocket = ({
  activeConversationId,
  onMessageReceived,
  onMessageEdited,
  onMessageDeleted,
  onMessageRecalled,
  onTyping,
  onReadReceipt,
}) => {
  const { user } = useContext(AuthContext);

  // ============================================
  // EMIT FUNCTIONS
  // ============================================

  /**
   * Emit typing indicator
   * @param {string} conversationId - Conversation ID
   * @param {boolean} isTyping - Is user typing?
   */
  const emitTyping = useCallback((conversationId, isTyping) => {
    const socket = getSocket();
    if (!socket || !conversationId) return;
    
    console.log("⌨️  [useChatSocket] Emitting typing:", { conversationId, isTyping });
    socket.emit("typing", { conversationId, isTyping });
  }, []);

  /**
   * Emit mark_read event
   * Backend expects: { conversationId, lastSeenMessageId }
   */
  const emitMarkAsRead = useCallback((conversationId, lastSeenMessageId) => {
    const socket = getSocket();
    if (!socket || !conversationId || !lastSeenMessageId) return;
    
    console.log("📖 [useChatSocket] Emitting mark_read:", { 
      conversationId, 
      lastSeenMessageId 
    });
    
    socket.emit("mark_read", { 
      conversationId, 
      lastSeenMessageId 
    });
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

    // ============================================
    // ✅ MESSAGE RECEIVED HANDLER
    // ============================================
    const handleMessageReceived = (data) => {
      console.log("📨 [useChatSocket] message_received:", data);
      
      const { conversationId, message } = data;
      
      if (!message) {
        console.error("❌ [useChatSocket] No message in data");
        return;
      }
      
      if (conversationId !== activeConversationId) {
        console.warn("⚠️ [useChatSocket] Message for different conversation");
        return;
      }
      
      console.log("✅ [useChatSocket] Processing message:", {
        messageId: message.messageId,
        from: message.sender?.nickname,
        isOwn: message.sender?.uid === user?.uid,
      });

      if (onMessageReceived) {
        onMessageReceived(message);
      }
    };

    // ============================================
    // ✅ MESSAGE EDITED HANDLER (callback only)
    // ============================================
    // Note: Store update is handled by useGlobalSocket
    // This only triggers UI callbacks for active conversation
    const handleMessageEdited = (data) => {
      console.log("✏️ [useChatSocket] message_edited:", data);
      
      const { conversationId, message } = data;
      
      if (!message) {
        console.error("❌ [useChatSocket] No message in edit event");
        return;
      }
      
      if (conversationId !== activeConversationId) {
        console.log("⏭️ [useChatSocket] Edit for different conversation (handled by useGlobalSocket)");
        return;
      }
      
      console.log("✅ [useChatSocket] Edit is for active conversation, calling callback");
      
      // Call callback for UI updates (e.g., scroll to edited message)
      if (onMessageEdited) {
        onMessageEdited(message);
      }
    };

    // ============================================
    // ✅ MESSAGE DELETED HANDLER (callback only)
    // ============================================
    // Note: Store update is handled by useGlobalSocket
    const handleMessageDeleted = (data) => {
      console.log("🗑️ [useChatSocket] message_deleted:", data);
      
      const { conversationId, messageId } = data;
      
      if (conversationId !== activeConversationId) {
        console.log("⏭️ [useChatSocket] Delete for different conversation (handled by useGlobalSocket)");
        return;
      }
      
      console.log("✅ [useChatSocket] Delete is for active conversation, calling callback");
      
      // Call callback for UI updates
      if (onMessageDeleted) {
        onMessageDeleted(messageId);
      }
    };

    // ============================================
    // ✅ MESSAGE RECALLED HANDLER (callback only)
    // ============================================
    // Note: Store update is handled by useGlobalSocket
    const handleMessageRecalled = (data) => {
      console.log("↩️ [useChatSocket] message_recalled:", data);
      
      const { conversationId, messageId, recalledBy, recalledAt } = data;
      
      if (conversationId !== activeConversationId) {
        console.log("⏭️ [useChatSocket] Recall for different conversation (handled by useGlobalSocket)");
        return;
      }
      
      console.log("✅ [useChatSocket] Recall is for active conversation, calling callback");
      
      // Call callback for UI updates
      if (onMessageRecalled) {
        onMessageRecalled(data);
      }
    };

    // ============================================
    // ✅ TYPING INDICATOR HANDLER
    // ============================================
    const handleUserTyping = (data) => {
      console.log("⌨️  [useChatSocket] user_typing:", data);
      
      const { conversationId, user: typingUser, isTyping } = data;
      
      if (conversationId !== activeConversationId) return;
      
      if (onTyping) {
        onTyping(typingUser, isTyping);
      }
    };

    // ============================================
    // ✅ READ RECEIPT HANDLER
    // ============================================
    const handleReadReceipt = (data) => {
      console.log("📖 [useChatSocket] message_read_receipt:", data);
      
      const { conversationId, userUid, lastSeenMessageId } = data;
      
      if (conversationId !== activeConversationId) {
        console.warn("⚠️ [useChatSocket] Read receipt for different conversation");
        return;
      }
      
      console.log("✅ [useChatSocket] Processing read receipt:", {
        userUid,
        lastSeenMessageId,
      });
      
      // Call callback if provided
      if (onReadReceipt) {
        onReadReceipt(userUid, lastSeenMessageId);
      }
    };

    // ============================================
    // REGISTER ALL LISTENERS
    // ============================================
    console.log("📝 [useChatSocket] Registering socket listeners...");
    
    socket.on("message_received", handleMessageReceived);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_recalled", handleMessageRecalled);
    socket.on("user_typing", handleUserTyping);
    socket.on("message_read_receipt", handleReadReceipt);
    
    console.log("✅ [useChatSocket] All listeners registered");

    // ============================================
    // JOIN CONVERSATION
    // ============================================
    console.log("📥 [useChatSocket] Joining conversation:", activeConversationId);
    
    socket.emit("join_conversation", { 
      conversationId: activeConversationId 
    });

    // ============================================
    // CLEANUP
    // ============================================
    return () => {
      console.log("🧹 [useChatSocket] Cleaning up listeners for:", activeConversationId);
      
      socket.off("message_received", handleMessageReceived);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_recalled", handleMessageRecalled);
      socket.off("user_typing", handleUserTyping);
      socket.off("message_read_receipt", handleReadReceipt);
      
      console.log("📤 [useChatSocket] Leaving conversation:", activeConversationId);
      
      socket.emit("leave_conversation", { 
        conversationId: activeConversationId 
      });
      
      console.log("✅ [useChatSocket] Cleanup complete");
    };
  }, [
    activeConversationId,
    user,
    onMessageReceived,
    onMessageEdited,
    onMessageDeleted,
    onMessageRecalled,
    onTyping,
    onReadReceipt,
  ]);

  // ============================================
  // RETURN EMIT FUNCTIONS
  // ============================================
  return {
    emitTyping,
    emitMarkAsRead,
  };
};