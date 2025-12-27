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
 * ChatWindow Component - Mobile-First Optimized (Pure Tailwind)
 * 
 * ✅ Better mobile spacing
 * ✅ Smooth scrolling
 * ✅ Optimized touch interactions
 * ✅ Improved loading states
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
  // SCROLL TO BOTTOM
  // ============================================

  const scrollToBottom = (behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(
      () => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: behavior === "smooth" ? "smooth" : "auto"
        });
      },
      behavior === "smooth" ? 100 : 0
    );
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

      isUserScrollingRef.current = !isAtBottom;

      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        if (isAtBottom) {
          isUserScrollingRef.current = false;
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    if (!messages.length || loading) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    if (!isUserScrollingRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length, loading]);

  useEffect(() => {
    if (activeConversationId && messages.length) {
      isUserScrollingRef.current = false;
      scrollToBottom("auto");
    }
  }, [activeConversationId, messages.length]);

  // ============================================
  // INFINITE SCROLL
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

        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
          container.scrollTop = scrollTop + scrollDiff;
        }, 50);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
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
  // GET DISPLAY INFO
  // ============================================

  const getDisplayInfo = () => {
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
      <div className="flex flex-col h-full w-full bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header with mobile spacing */}
        <div className="pt-16 lg:pt-0">
          <ChatHeader
            receiverName={displayInfo.name}
            receiverAvatar={displayInfo.avatar}
            isTyping={false}
          />
        </div>

        {/* Loading indicator */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="relative w-14 h-14 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">
              {t("loading.messages") || "Đang tải tin nhắn..."}
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
    <div className="flex flex-col h-full w-full min-h-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header - Mobile optimized padding */}
      <div className="pt-16 lg:pt-0">
        <ChatHeader
          receiverName={displayInfo.name}
          receiverAvatar={displayInfo.avatar}
          isTyping={!!typingUser}
          typingUserName={typingUser?.nickname || typingUser?.fullName}
        />
      </div>

      {/* Messages Container - Optimized scrolling */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-5"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Loading More Indicator */}
        {loading && hasMore && messages.length > 0 && (
          <div className="flex justify-center py-4 mb-3">
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-white px-5 py-2.5 rounded-full shadow-md">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">{t("loading.more") || "Đang tải thêm..."}</span>
            </div>
          </div>
        )}

        {/* Empty State: New Conversation */}
        {messages.length === 0 && displayInfo.isNewConversation && (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center max-w-sm">
              <div className="relative w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-5 overflow-hidden shadow-xl ring-4 ring-blue-100">
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

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {displayInfo.name}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {t("empty.newConversation") || "Bắt đầu cuộc trò chuyện"}
              </p>
            </div>
          </div>
        )}

        {/* Empty State: Existing Conversation */}
        {messages.length === 0 && !displayInfo.isNewConversation && !loading && (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
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
              </div>
              <p className="text-gray-600 font-medium mb-1">
                {t("empty.title") || "Chưa có tin nhắn"}
              </p>
              <p className="text-gray-400 text-sm">
                {t("empty.subtitle") || "Hãy bắt đầu cuộc trò chuyện!"}
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
          <div className="flex items-start gap-3 mt-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden shrink-0 shadow-md">
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
            <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3.5 shadow-md border border-gray-100">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
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
            ? t("input.startConversation") || "Bắt đầu cuộc trò chuyện..."
            : t("input.placeholder") || "Nhập tin nhắn..."
        }
      />
    </div>
  );
}