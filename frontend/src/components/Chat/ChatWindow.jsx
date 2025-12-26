// frontend/src/components/Chat/ChatWindow.jsx
import { useEffect, useRef } from "react";
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
 * ✅ SUPPORTS LAZY CONVERSATION:
 * - Can render even without conversationId
 * - Shows "Start conversation" state
 * - Creates conversation on first message
 * 
 * Main chat interface:
 * - Message display with infinite scroll
 * - Send messages with optimistic UI
 * - Typing indicators
 * - Mark as read
 * - Real-time updates via socket
 */
export default function ChatWindow() {
  const { t } = useTranslation("chat");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // ============================================
  // GET STATE FROM STORE
  // ============================================

  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const activeFriend = useChatStore((state) => state.activeFriend); // 🔥 For lazy conversation
  const conversations = useChatStore((state) => state.conversations);
  const currentUser = useChatStore((state) => state.currentUser);

  const conversation = activeConversationId
    ? conversations.get(activeConversationId)
    : null;

  // ============================================
  // HOOKS
  // ============================================

  // 🔥 Messages (handles null conversationId)
  const {
    messages,
    loading,
    hasMore,
    error,
    loadMore,
    scrollToBottom: scrollToBottomHook,
    messagesEndRef: hookMessagesEndRef,
    hasMessages,
  } = useMessages(activeConversationId);

  // 🔥 Send message (supports lazy conversation)
  const { sendMessage, retryMessage, sending } = useSendMessage();

  // 🔥 Typing indicator (handles null conversationId)
  const { isTyping, typingUsers, startTyping, stopTyping } = useTyping(activeConversationId);

  // 🔥 Mark as read (handles null conversationId)
  useMarkAsRead(activeConversationId);

  // ============================================
  // AUTO SCROLL TO BOTTOM
  // ============================================

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (hasMessages && !loading) {
      const container = messagesContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

        if (isNearBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    }
  }, [messages.length, loading, hasMessages]);

  // Initial scroll to bottom when conversation changes
  useEffect(() => {
    if (activeConversationId && hasMessages) {
      setTimeout(() => scrollToBottom("auto"), 200);
    }
  }, [activeConversationId, hasMessages]);

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

        // Restore scroll position
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
      // 🔥 Send with conversationId OR recipientId
      const result = await sendMessage(
        activeConversationId, // null if no conversation yet
        activeFriend?.uid, // recipientId for lazy creation
        {
          content: text.trim(),
          type: "text",
        }
      );

      if (result) {
        console.log("✅ Message sent successfully");
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      // Error already handled in useSendMessage
    }
  };

  const handleTypingChange = (typing) => {
    // 🔥 Only emit typing if conversation exists
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
    // 🔥 If no conversation, use activeFriend
    if (!conversation && activeFriend) {
      return {
        name: activeFriend.nickname || activeFriend.fullName || activeFriend.uid,
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

    // Private chat
    return {
      name: conversation.friend?.nickname || conversation.friend?.fullName || "Unknown",
      avatar: conversation.friend?.avatar,
      type: "private",
      isNewConversation: false,
    };
  };

  const displayInfo = getDisplayInfo();
  const typingUser = typingUsers.length > 0 ? typingUsers[0] : null;

  // ============================================
  // RENDER STATES
  // ============================================

  // No conversation AND no friend selected
  if (!displayInfo) {
    return <ChatEmptyState />;
  }

  // Loading initial messages (only if conversation exists)
  if (loading && activeConversationId) {
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
            <p className="text-gray-500 text-sm">{t("loading.messages") || "Loading messages..."}</p>
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
        {loading && hasMore && hasMessages && (
          <div className="flex justify-center py-3 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{t("loading.more") || "Loading more..."}</span>
            </div>
          </div>
        )}

        {/* Empty State: New Conversation */}
        {!hasMessages && displayInfo.isNewConversation && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4 overflow-hidden">
                {displayInfo.avatar ? (
                  <img src={displayInfo.avatar} alt={displayInfo.name} className="w-full h-full object-cover" />
                ) : (
                  displayInfo.name[0]?.toUpperCase() || "?"
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-1">{displayInfo.name}</h3>
              <p className="text-gray-500 text-sm mb-6">
                {t("empty.newConversation") || "Start your conversation"}
              </p>

              {/* Suggested Messages */}
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => handleSendMessage("Hi! 👋")}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={sending}
                >
                  👋 Say Hi
                </button>
                <button
                  onClick={() => handleSendMessage("How are you?")}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={sending}
                >
                  💬 Ask how they are
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State: Existing Conversation */}
        {!hasMessages && !displayInfo.isNewConversation && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 text-sm font-medium">{t("empty.title") || "No messages yet"}</p>
              <p className="text-gray-400 text-xs mt-1">{t("empty.subtitle") || "Start the conversation!"}</p>
            </div>
          </div>
        )}

        {/* Message List */}
        {hasMessages && (
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
                <img src={typingUser.avatar} alt={typingUser.nickname} className="w-full h-full object-cover" />
              ) : (
                (typingUser.nickname || typingUser.fullName)?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              </div>
            </div>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
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