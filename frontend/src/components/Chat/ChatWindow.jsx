// frontend/src/components/Chat/ChatWindow.jsx
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useChatStore from "../../store/chatStore";
import  useMessages from "../../hooks/chat/useMessages";
import  useSendMessage  from "../../hooks/chat/useSendMessage";
import  useTyping  from "../../hooks/chat/useTyping";
import  useMarkAsRead  from "../../hooks/chat/useMarkAsRead";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ChatEmptyState from "./ChatEmptyState";

/**
 * ChatWindow Component
 * 
 * Main chat interface - orchestrates all chat features:
 * - Message display with infinite scroll
 * - Send messages with optimistic UI
 * - Typing indicators
 * - Mark as read
 * - Real-time updates via socket
 * 
 * No longer needs onUpdateSidebar - store handles it automatically
 */
export default function ChatWindow() {
  const { t } = useTranslation("chat");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // ============================================
  // GET ACTIVE CONVERSATION FROM STORE
  // ============================================

  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const currentUser = useChatStore((state) => state.currentUser);

  const conversation = activeConversationId 
    ? conversations.get(activeConversationId) 
    : null;

  // ============================================
  // HOOKS
  // ============================================

  // Messages with infinite scroll
  const {
    messages,
    loading,
    hasMore,
    loadingMore,
    loadMoreMessages,
  } = useMessages(activeConversationId);

  // Send message with optimistic UI
  const { sendMessage, sending } = useSendMessage(activeConversationId);

  // Typing indicator
  const { isTyping, typingUsers, startTyping, stopTyping } = useTyping(activeConversationId);

  // Mark as read
  const { markAsRead } = useMarkAsRead(activeConversationId);

  // ============================================
  // AUTO SCROLL TO BOTTOM
  // ============================================

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Only smooth scroll if we're already near the bottom
      const container = messagesContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    }
  }, [messages.length, loading]);

  // Initial scroll to bottom when conversation changes
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      setTimeout(() => scrollToBottom("auto"), 200);
    }
  }, [activeConversationId]);

  // ============================================
  // INFINITE SCROLL FOR LOADING MORE MESSAGES
  // ============================================

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearTop = scrollTop < 100;

      if (isNearTop && hasMore && !loading && !loadingMore) {
        // Save scroll position before loading
        prevScrollHeightRef.current = scrollHeight;

        await loadMoreMessages();

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
  }, [hasMore, loading, loadingMore, loadMoreMessages]);

  // ============================================
  // MARK AS READ WHEN SCROLLING TO BOTTOM
  // ============================================

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !activeConversationId || messages.length === 0) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      if (isAtBottom) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.sender?.uid !== currentUser?.uid) {
          markAsRead(lastMessage._id);
        }
      }
    };

    // Mark as read immediately if at bottom
    handleScroll();

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeConversationId, messages, currentUser?.uid, markAsRead]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    
    await sendMessage(text.trim());
    
    // Scroll to bottom after sending
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleTypingChange = (typing) => {
    if (typing) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // ============================================
  // GET DISPLAY INFO
  // ============================================

  const getDisplayInfo = () => {
    if (!conversation) return null;

    if (conversation.type === "group") {
      return {
        name: conversation.name || "Group Chat",
        avatar: conversation.avatar,
        type: "group",
      };
    }

    // Private chat
    return {
      name: conversation.friend?.nickname || conversation.friend?.uid || "Unknown",
      avatar: conversation.friend?.avatar,
      type: "private",
    };
  };

  const displayInfo = getDisplayInfo();

  // Get typing user for display
  const typingUser = typingUsers.length > 0 ? typingUsers[0] : null;

  // ============================================
  // RENDER STATES
  // ============================================

  // No conversation selected
  if (!conversation || !activeConversationId) {
    return <ChatEmptyState />;
  }

  // Loading initial messages
  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full w-full bg-gradient-to-br from-gray-50 to-blue-50">
        <ChatHeader
          receiverName={displayInfo?.name || "Loading..."}
          receiverAvatar={displayInfo?.avatar}
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
        receiverName={displayInfo?.name || "Unknown"}
        receiverAvatar={displayInfo?.avatar}
        isTyping={!!typingUser}
        typingUserName={typingUser?.nickname || typingUser?.fullName}
      />

      {/* Messages Container with Infinite Scroll */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {/* Loading More Indicator */}
        {loadingMore && hasMore && (
          <div className="flex justify-center py-3 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{t("loading.more") || "Loading more messages..."}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 && !loading && (
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
            isPrivateChat={conversation.type === "private"}
            isGroupChat={conversation.type === "group"}
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
                (typingUser.nickname || typingUser.fullName)?.[0]?.toUpperCase() || "?"
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
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
        disabled={!activeConversationId || sending}
        sending={sending}
      />
    </div>
  );
}