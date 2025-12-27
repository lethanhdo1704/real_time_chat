// frontend/src/components/Chat/ChatWindow.jsx
import { useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useChatStore from "../../store/chatStore";
import useMessages from "../../hooks/chat/useMessages";
import useSendMessage from "../../hooks/chat/useSendMessage";
import useTyping from "../../hooks/chat/useTyping";
import useMarkAsRead from "../../hooks/chat/useMarkAsRead";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ChatEmptyState from "./ChatEmptyState";

/**
 * ChatWindow Component
 *
 * ✅ FIXED:
 * - Tin nhắn mới tự động scroll xuống
 * - Tin nhắn được sắp xếp đúng theo thời gian
 * - Fix logic hiển thị empty state cho conversation có sẵn
 * - Use activeFriend as fallback when conversation.friend is missing
 */
export default function ChatWindow() {
  const { t } = useTranslation("chat");
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

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
  // 🔥 SORT MESSAGES BY TIMESTAMP
  // ============================================
  const messages = useMemo(() => {
    if (!rawMessages || rawMessages.length === 0) return [];

    return [...rawMessages].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp).getTime();
      const timeB = new Date(b.createdAt || b.timestamp).getTime();
      return timeA - timeB; // Oldest first
    });
  }, [rawMessages]);

  // ============================================
  // 🔥 IMPROVED SCROLL TO BOTTOM
  // ============================================

  const scrollToBottom = (behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(
      () => {
        container.scrollTop = container.scrollHeight;
      },
      behavior === "smooth" ? 100 : 0
    );
  };

  // Track if user is manually scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      isUserScrollingRef.current = !isAtBottom;

      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Reset user scrolling flag after 150ms of no scrolling
      scrollTimeout = setTimeout(() => {
        if (isAtBottom) {
          isUserScrollingRef.current = false;
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // ============================================
  // 🔥 AUTO SCROLL ON NEW MESSAGES
  // ============================================

  useEffect(() => {
    if (!messages.length || loading) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    // Only auto-scroll if user is not manually scrolling
    if (!isUserScrollingRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length, loading]);

  // ============================================
  // INITIAL SCROLL ON CONVERSATION CHANGE
  // ============================================

  useEffect(() => {
    if (activeConversationId && messages.length) {
      isUserScrollingRef.current = false;
      scrollToBottom("auto");
    }
  }, [activeConversationId, messages.length]);

  // ============================================
  // INFINITE SCROLL (LOAD MORE)
  // ============================================

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore) return;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight } = container;
      const isNearTop = scrollTop < 100;

      if (isNearTop && hasMore && !loading) {
        prevScrollHeightRef.current = scrollHeight;

        await loadMore();

        // Restore scroll position after loading
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
          container.scrollTop = scrollTop + scrollDiff;
        }, 50);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, loadMore]);

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
        // Force scroll after sending
        isUserScrollingRef.current = false;
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
  // 🔥 GET DISPLAY INFO - WITH FALLBACK TO activeFriend
  // ============================================

  const getDisplayInfo = () => {
    // Trường hợp 1: Click vào friend mới (chưa có conversation)
    if ((!conversation || conversation._placeholder) && activeFriend) {
      return {
        name:
          activeFriend.nickname || activeFriend.fullName || activeFriend.uid,
        avatar: activeFriend.avatar,
        type: "private",
        isNewConversation: true,
      };
    }

    // Trường hợp 2: Không có gì cả
    if (!conversation) return null;

    // Trường hợp 3: Group chat (có conversation)
    if (conversation.type === "group") {
      return {
        name: conversation.name || "Group Chat",
        avatar: conversation.avatar,
        type: "group",
        isNewConversation: false,
      };
    }

    // Trường hợp 4: Private chat (có conversation)
    // 🔥 FIX: Use activeFriend as fallback if conversation.friend is missing
    const friendInfo = conversation.friend || activeFriend;

    return {
      name: friendInfo?.nickname || friendInfo?.fullName || "Unknown",
      avatar: friendInfo?.avatar,
      type: "private",
      isNewConversation: false,
    };
  };

  const displayInfo = getDisplayInfo();
  const typingUser = typingUsers.length > 0 ? typingUsers[0] : null;

  // ============================================
  // RENDER STATES
  // ============================================

  if (!displayInfo) {
    return <ChatEmptyState />;
  }

  if (loading && activeConversationId && !messages.length) {
    return (
      <div className="flex flex-col h-full w-full bg-gradient-to-br from-gray-50 to-blue-50">
        <ChatHeader
          receiverName={displayInfo.name}
          receiverAvatar={displayInfo.avatar}
          isTyping={false}
        />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">
              {t("loading.messages") || "Loading messages..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <ChatHeader
        receiverName={displayInfo.name}
        receiverAvatar={displayInfo.avatar}
        isTyping={!!typingUser}
        typingUserName={typingUser?.nickname || typingUser?.fullName}
      />

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {/* Loading More Indicator */}
        {loading && hasMore && messages.length && (
          <div className="flex justify-center py-3 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{t("loading.more") || "Loading more..."}</span>
            </div>
          </div>
        )}

        {/* 🔥 Empty State: ONLY for truly new conversations (no conversation object exists) */}
        {messages.length === 0 && displayInfo.isNewConversation && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4 overflow-hidden">
                {displayInfo.avatar ? (
                  <img
                    src={displayInfo.avatar}
                    alt={displayInfo.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayInfo.name[0]?.toUpperCase() || "?"
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {displayInfo.name}
              </h3>
              <p className="text-gray-500 text-sm">
                {t("empty.newConversation") || "Start your conversation"}
              </p>
            </div>
          </div>
        )}

        {/* 🔥 Empty State: For existing conversations with no messages yet */}
        {messages.length === 0 && !displayInfo.isNewConversation && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-gray-500 text-sm font-medium">
                {t("empty.title") || "No messages yet"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {t("empty.subtitle") || "Start the conversation!"}
              </p>
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.length > 0 && (
          <MessageList
            messages={messages}
            activeUser={currentUser}
            isPrivateChat={displayInfo.type === "private"}
            isGroupChat={displayInfo.type === "group"}
            onRetryMessage={handleRetryMessage}
          />
        )}

        {/* Typing Indicator */}
        {typingUser && (
          <div className="flex items-start gap-2 mt-2 animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold overflow-hidden shrink-0">
              {typingUser.avatar ? (
                <img
                  src={typingUser.avatar}
                  alt={typingUser.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                (typingUser.nickname ||
                  typingUser.fullName)?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></span>
              </div>
            </div>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={hookMessagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
        disabled={sending}
        sending={sending}
        placeholder={
          displayInfo.isNewConversation
            ? t("input.startConversation") || "Start your conversation..."
            : t("input.placeholder") || "Type a message..."
        }
      />
    </div>
  );
}
