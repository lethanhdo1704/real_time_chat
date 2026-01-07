// frontend/src/user/components/Chat/ChatWindow/ChatWindow.jsx

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import useChatWindowLogic from "../../../hooks/chat/useChatWindowLogic.js";
import ChatWindowHeader from "./ChatWindowHeader.jsx";
import ChatWindowBody from "./ChatWindowBody.jsx";
import ChatInput from "../ChatInput.jsx";
import ChatEmptyState from "../ChatEmptyState.jsx";
import useChatStore from "../../../store/chat/chatStore.js";
import useFriendStore from "../../../store/friendStore.js";

/**
 * ChatWindow Component - Main Container
 * 
 * ✅ Use activeConversationId (string) instead of activeConversation (object)
 * ✅ Real-time presence: Get friend's isOnline/lastSeen from friendStore
 * ✅ Auto-merge presence data with displayInfo
 * ✅ Mobile responsive with back navigation
 * 
 * Responsibilities:
 * - Layout structure & composition
 * - Merge presence data from multiple sources
 * - Pass unified data to child components
 * - Handle navigation & focus management
 */
export default function ChatWindow() {
  const { t } = useTranslation("chat");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================
  // GET CONVERSATION & FRIEND DATA
  // ============================================
  const conversationId = useChatStore((state) => state.activeConversationId);
  const activeFriend = useChatStore((state) => state.activeFriend);

  // ============================================
  // GET FRIEND PRESENCE FROM STORE (Real-time)
  // WHY: friendStore is updated by socket events (user_online/user_offline)
  // ============================================
  const getFriend = useFriendStore((state) => state.getFriend);
  const friendPresence = activeFriend?.uid ? getFriend(activeFriend.uid) : null;

  // ============================================
  // GET CHAT DATA FROM HOOK
  // ============================================
  const {
    displayInfo,
    typingUser,
    messages,
    loading,
    hasMore,
    sending,
    messagesContainerRef,
    typingIndicatorRef,
    hookMessagesEndRef,
    handleSendMessage,
    handleTypingChange,
    handleRetryMessage,
    currentUser,
  } = useChatWindowLogic();

  // ============================================
  // 🔥 MERGE PRESENCE DATA - PRIORITY ORDER
  // ============================================
  // Priority 1: friendPresence from friendStore (most up-to-date)
  // Priority 2: activeFriend from chatStore (cached)
  // Priority 3: displayInfo default (fallback)
  const displayInfoWithPresence = displayInfo ? {
    ...displayInfo,
    isOnline: friendPresence?.isOnline ?? activeFriend?.isOnline ?? displayInfo.isOnline ?? false,
    lastSeen: friendPresence?.lastSeen ?? activeFriend?.lastSeen ?? displayInfo.lastSeen ?? null,
  } : null;

  // ============================================
  // MOBILE BACK HANDLER
  // ============================================
  const handleBackClick = () => {
    const pathParts = location.pathname.split("/");
    const currentTab = pathParts[1] || "friends";
    
    // Clear active conversation state
    useChatStore.getState().exitConversation();
    
    // Navigate back to list view
    navigate(`/${currentTab}`);
  };

  // ============================================
  // FOCUS INPUT HANDLER
  // ============================================
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // ============================================
  // RENDER: Empty State
  // ============================================
  if (!displayInfoWithPresence) {
    return <ChatEmptyState />;
  }

  // ============================================
  // RENDER: Initial Loading
  // ============================================
  if (loading && !messages.length) {
    return (
      <div className="flex flex-col h-full w-full bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
        <ChatWindowHeader
          receiverName={displayInfoWithPresence.name}
          receiverAvatar={displayInfoWithPresence.avatar}
          isTyping={false}
          isOnline={displayInfoWithPresence.isOnline}
          lastSeen={displayInfoWithPresence.lastSeen}
          showBackButton={true}
          onBackClick={handleBackClick}
        />

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
  // RENDER: Main Chat Window
  // ============================================
  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with Real-time Presence */}
      <ChatWindowHeader
        receiverName={displayInfoWithPresence.name}
        receiverAvatar={displayInfoWithPresence.avatar}
        isTyping={!!typingUser}
        typingUserName={typingUser?.nickname || typingUser?.fullName}
        isOnline={displayInfoWithPresence.isOnline}
        lastSeen={displayInfoWithPresence.lastSeen}
        showBackButton={true}
        onBackClick={handleBackClick}
      />

      {/* Body: Messages + Typing + Empty States */}
      <ChatWindowBody
        messagesContainerRef={messagesContainerRef}
        typingIndicatorRef={typingIndicatorRef}
        hookMessagesEndRef={hookMessagesEndRef}
        messages={messages}
        conversationId={conversationId}
        loading={loading}
        hasMore={hasMore}
        displayInfo={displayInfoWithPresence}
        typingUser={typingUser}
        currentUser={currentUser}
        onRetryMessage={handleRetryMessage}
        onFocusInput={focusInput}
        t={t}
      />

      {/* Input */}
      <ChatInput
        ref={inputRef}
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
        disabled={sending}
        sending={sending}
        placeholder={
          displayInfoWithPresence.isNewConversation
            ? t("input.startConversation") || "Bắt đầu cuộc trò chuyện..."
            : t("input.placeholder") || "Nhập tin nhắn..."
        }
      />
    </div>
  );
}