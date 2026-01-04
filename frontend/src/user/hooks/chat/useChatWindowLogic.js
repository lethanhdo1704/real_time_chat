// frontend/src/hooks/chat/useChatWindowLogic.js
import { useMemo, useEffect } from "react";
import useChatStore from "../../store/chat/chatStore.js";
import useMessages from "./useMessages.js";
import useSendMessage from "./useSendMessage.js";
import useTyping from "./useTyping.js";
import useMarkAsRead from "./useMarkAsRead.js";
import useChatScroll from "./useChatScroll.js";
import { getConversationById } from "../../services/chatApi";

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
  
  const setConversationDetail = useChatStore(
    (state) => state.setConversationDetail
  );

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
  // 🔥 FETCH CONVERSATION DETAIL + INIT READ RECEIPTS
  // ============================================
  useEffect(() => {
    if (!activeConversationId) return;

    const conv = conversations.get(activeConversationId);

    // 🔥 ALWAYS fetch if no _detailFetched flag
    if (conv?._detailFetched) {
      console.log('⏭️ [useChatWindowLogic] Detail already fetched, skipping');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        console.log("📥 [useChatWindowLogic] Fetching conversation detail:", activeConversationId);

        const detail = await getConversationById(activeConversationId);

        if (!cancelled && detail) {
          setConversationDetail(detail);
          console.log("✅ [useChatWindowLogic] Conversation detail merged");

          // 🆕 Initialize read receipts from members
          if (detail.members && detail.members.length > 0) {
            console.log("📖 [useChatWindowLogic] Initializing read receipts from detail");
            
            const { updateReadReceipt } = useChatStore.getState();
            
            detail.members.forEach((member) => {
              // 🔥 FIX: Handle both structures
              const memberUser = member.user || member;
              const lastSeenMessageId = member.lastSeenMessage;

              // Skip if no lastSeenMessage or if it's current user
              if (!lastSeenMessageId || !memberUser || memberUser.uid === currentUser?.uid) {
                return;
              }

              console.log('📖 [useChatWindowLogic] Adding receipt for:', {
                userUid: memberUser.uid,
                nickname: memberUser.nickname,
                lastSeenMessage: lastSeenMessageId,
              });

              updateReadReceipt(
                activeConversationId,
                memberUser.uid,
                lastSeenMessageId,
                {
                  avatar: memberUser.avatar,
                  nickname: memberUser.nickname,
                }
              );
            });

            console.log('✅ [useChatWindowLogic] Read receipts initialized');
          }
        }
      } catch (err) {
        console.error("❌ [useChatWindowLogic] Failed to fetch conversation detail:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, conversations, setConversationDetail, currentUser]);

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
  const handleSendMessage = async (text, replyToId = null) => {
    if (!text.trim()) return;

    console.log("📤 [useChatWindowLogic] Sending message:", {
      conversationId: activeConversationId,
      hasReply: !!replyToId,
      replyToId,
    });

    try {
      // Get full reply data if replyToId provided
      let replyToData = null;
      if (replyToId) {
        replyToData = useChatStore.getState().findMessageById(activeConversationId, replyToId);
        console.log("🔍 [useChatWindowLogic] Found reply message:", replyToData);
      }

      const result = await sendMessage(
        activeConversationId,
        activeFriend?.uid,
        {
          content: text.trim(),
          type: "text",
          replyTo: replyToData,
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