// frontend/src/components/Chat/ChatWindow/ChatWindow.jsx
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import useChatWindowLogic from "../../../hooks/chat/useChatWindowLogic.js";
import ChatWindowHeader from "./ChatWindowHeader.jsx";
import ChatWindowBody from "./ChatWindowBody.jsx";
import ChatInput from "../ChatInput.jsx";
import ChatEmptyState from "../ChatEmptyState.jsx";

/**
 * ChatWindow Component - Main Container (NO LOGIC)
 * 
 * Responsibilities:
 * - Layout structure
 * - Compose child components
 * - Pass data from hook to children
 */
export default function ChatWindow() {
  const { t } = useTranslation("chat");
  const inputRef = useRef(null);  // 🔥 Ref to ChatInput

  // ============================================
  // ALL LOGIC IN CUSTOM HOOK
  // ============================================
  const {
    // Display info
    displayInfo,
    typingUser,
    
    // Message data
    messages,
    loading,
    hasMore,
    sending,
    
    // Refs
    messagesContainerRef,
    typingIndicatorRef,
    hookMessagesEndRef,
    
    // Handlers
    handleSendMessage,
    handleTypingChange,
    handleRetryMessage,
    handleFocusInput,
    
    // User
    currentUser,
  } = useChatWindowLogic();

  // ============================================
  // FOCUS INPUT HANDLER
  // ============================================
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // ============================================
  // RENDER: Empty State
  // ============================================
  if (!displayInfo) {
    return <ChatEmptyState />;
  }

  // ============================================
  // RENDER: Initial Loading
  // ============================================
  if (loading && !messages.length) {
    return (
      <div className="flex flex-col h-full w-full bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="pt-16 lg:pt-0">
          <ChatWindowHeader
            receiverName={displayInfo.name}
            receiverAvatar={displayInfo.avatar}
            isTyping={false}
          />
        </div>

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
      {/* Header */}
      <div className="pt-16 lg:pt-0">
        <ChatWindowHeader
          receiverName={displayInfo.name}
          receiverAvatar={displayInfo.avatar}
          isTyping={!!typingUser}
          typingUserName={typingUser?.nickname || typingUser?.fullName}
        />
      </div>

      {/* Body: Messages + Typing + Empty States */}
      <ChatWindowBody
        messagesContainerRef={messagesContainerRef}
        typingIndicatorRef={typingIndicatorRef}
        hookMessagesEndRef={hookMessagesEndRef}
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        displayInfo={displayInfo}
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
          displayInfo.isNewConversation
            ? t("input.startConversation") || "Bắt đầu cuộc trò chuyện..."
            : t("input.placeholder") || "Nhập tin nhắn..."
        }
      />
    </div>
  );
}