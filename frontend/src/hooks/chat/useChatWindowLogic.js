// frontend/src/hooks/chat/useChatWindowLogic.js
import { useMemo } from "react";
import useChatStore from "../../store/chatStore.js";
import useMessages from "./useMessages.js";
import useSendMessage from "./useSendMessage.js";
import useTyping from "./useTyping.js";
import useMarkAsRead from "./useMarkAsRead.js";
import useChatScroll from "./useChatScroll.js";

export default function useChatWindowLogic() {
  // ============================================
  // GET STATE FROM STORE
  // ============================================
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId
  );
  const activeFriend = useChatStore((state) => state.activeFriend);
  const conversations = useChatStore((state) => state.conversations);
  const currentUser = useChatStore((state) => state.currentUser);

  const conversation = activeConversationId
    ? conversations.get(activeConversationId)
    : null;

  // ============================================
  // HOOKS
  // ============================================
  const {
    messages: rawMessages,
    loading,
    hasMore,
    error,
    loadMore,
    messagesEndRef: hookMessagesEndRef,
  } = useMessages(activeConversationId);

  const { sendMessage, retryMessage, sending } = useSendMessage();
  const { isTyping, typingUsers, startTyping, stopTyping } =
    useTyping(activeConversationId);
  useMarkAsRead(activeConversationId);

  // ============================================
  // SORT MESSAGES BY TIMESTAMP
  // ============================================
  const messages = useMemo(() => {
    if (!rawMessages || rawMessages.length === 0) return [];

    return [...rawMessages].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp).getTime();
      const timeB = new Date(b.createdAt || b.timestamp).getTime();
      return timeA - timeB;
    });
  }, [rawMessages]);

  // ============================================
  // SCROLL LOGIC
  // ============================================
  const {
    messagesContainerRef,
    typingIndicatorRef,
    scrollToBottom,
  } = useChatScroll({
    messages,
    typingUsers,
    hasMore,
    loading,
    loadMore,
    activeConversationId,
  });

  // ============================================
  // HANDLERS
  // ============================================
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    try {
      const result = await sendMessage(
        activeConversationId,
        activeFriend?.uid,
        {
          content: text.trim(),
          type: "text",
        }
      );

      if (result) {
        console.log("✅ Message sent successfully");
        scrollToBottom("smooth");
      }
    } catch (error) {
      console.error("❌ Failed to send message:", error);
    }
  };

  const handleTypingChange = (typing) => {
    if (!activeConversationId) return;

    if (typing) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleRetryMessage = async (failedMessage) => {
    try {
      await retryMessage(failedMessage.clientMessageId, {
        conversationId: activeConversationId,
        recipientId: activeFriend?.uid,
        content: failedMessage.content,
        type: failedMessage.type,
        replyTo: failedMessage.replyTo,
        attachments: failedMessage.attachments,
      });
    } catch (error) {
      console.error("❌ Retry failed:", error);
    }
  };

  // ============================================
  // GET DISPLAY INFO
  // ============================================
  const displayInfo = useMemo(() => {
    if ((!conversation || conversation._placeholder) && activeFriend) {
      return {
        name:
          activeFriend.nickname || activeFriend.fullName || activeFriend.uid,
        avatar: activeFriend.avatar,
        type: "private",
        isNewConversation: true,
      };
    }

    if (!conversation) return null;

    if (conversation.type === "group") {
      return {
        name: conversation.name || "Group Chat",
        avatar: conversation.avatar,
        type: "group",
        isNewConversation: false,
      };
    }

    const friendInfo = conversation.friend || activeFriend;

    return {
      name: friendInfo?.nickname || friendInfo?.fullName || "Unknown",
      avatar: friendInfo?.avatar,
      type: "private",
      isNewConversation: false,
    };
  }, [conversation, activeFriend]);

  const typingUser = typingUsers.length > 0 ? typingUsers[0] : null;

  // ============================================
  // RETURN ALL DATA & HANDLERS
  // ============================================
  return {
    // Display info
    displayInfo,
    typingUser,

    // Message data
    messages,
    loading,
    hasMore,
    error,
    sending,

    // Refs
    messagesContainerRef,
    typingIndicatorRef,
    hookMessagesEndRef,

    // Handlers
    handleSendMessage,
    handleTypingChange,
    handleRetryMessage,
    scrollToBottom,

    // User
    currentUser,
  };
}