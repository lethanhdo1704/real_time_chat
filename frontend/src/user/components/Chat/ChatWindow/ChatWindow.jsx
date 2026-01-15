// frontend/src/user/components/Chat/ChatWindow/ChatWindow.jsx

import { useRef, useState } from "react"; // 🔥 Add useState
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import useChatWindowLogic from "../../../hooks/chat/useChatWindowLogic.js";
import ChatWindowHeader from "./ChatWindowHeader.jsx";
import ChatWindowBody from "./ChatWindowBody.jsx";
import ChatInput from "../ChatInput/ChatInput.jsx";
import ChatEmptyState from "../ChatEmptyState.jsx";
import ConversationInfo from "../ConversationInfo.jsx"; // 🔥 Import ConversationInfo
import useChatStore from "../../../store/chat/chatStore.js";
import useFriendStore from "../../../store/friendStore.js";
import useCallStore from "../../../store/call/callStore.js";
import callSocketService from "../../../services/socket/call.socket.js";
import { CALL_TYPE } from "../../../utils/call/callConstants.js";
import { useSocket } from "../../../context/SocketContext.jsx";

/**
 * ChatWindow Component - Main Container
 * 
 * ✅ Use activeConversationId (string) instead of activeConversation (object)
 * ✅ Real-time presence: Get friend's isOnline/lastSeen from friendStore
 * ✅ Auto-merge presence data with displayInfo
 * ✅ Mobile responsive with back navigation
 * ✅ Call functionality integrated
 * ✅ 🔥 NEW: Conversation Info modal
 * 
 * Responsibilities:
 * - Layout structure & composition
 * - Merge presence data from multiple sources
 * - Pass unified data to child components
 * - Handle navigation & focus management
 * - Handle call actions
 * - Handle conversation info modal
 */
export default function ChatWindow() {
  const { t } = useTranslation("chat");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 NEW: Conversation Info Modal State
  const [showConversationInfo, setShowConversationInfo] = useState(false);

  // ============================================
  // SOCKET (for call functionality)
  // ============================================
  const { socket } = useSocket();

  // ============================================
  // GET CONVERSATION & FRIEND DATA
  // ============================================
  const conversationId = useChatStore((state) => state.activeConversationId);
  const activeFriend = useChatStore((state) => state.activeFriend);

  // ============================================
  // GET FRIEND PRESENCE FROM STORE (Real-time)
  // ============================================
  const getFriend = useFriendStore((state) => state.getFriend);
  const friendPresence = activeFriend?.uid ? getFriend(activeFriend.uid) : null;

  // ============================================
  // CALL STORE
  // ============================================
  const startOutgoingCall = useCallStore((state) => state.startOutgoingCall);
  const isBusy = useCallStore((state) => state.isBusy);

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
  // 🔥 MERGE PRESENCE DATA
  // ============================================
  const displayInfoWithPresence = displayInfo ? {
    ...displayInfo,
    isOnline: friendPresence?.isOnline ?? activeFriend?.isOnline ?? displayInfo.isOnline ?? false,
    lastSeen: friendPresence?.lastSeen ?? activeFriend?.lastSeen ?? displayInfo.lastSeen ?? null,
  } : null;

  // ============================================
  // CALL HANDLERS
  // ============================================
  
  /**
   * Handle voice call button click
   */
  const handleVoiceCall = () => {
    if (!activeFriend?.uid) {
      console.error('[ChatWindow] No active friend UID');
      return;
    }

    if (!socket || !socket.connected) {
      console.error('[ChatWindow] Socket not connected');
      // TODO: Show toast "Connection error"
      return;
    }

    if (isBusy()) {
      console.warn('[ChatWindow] Already in a call');
      // TODO: Show toast "Already in a call"
      return;
    }

    console.log('[ChatWindow] Starting voice call with:', activeFriend.uid);

    // Update store state
    startOutgoingCall(
      activeFriend.uid,
      {
        username: displayInfoWithPresence.name,
        avatar: displayInfoWithPresence.avatar,
      },
      CALL_TYPE.VOICE
    );

    // Emit socket event
    callSocketService.startCall(activeFriend.uid, CALL_TYPE.VOICE);
  };

  /**
   * Handle video call button click
   */
  const handleVideoCall = () => {
    if (!activeFriend?.uid) {
      console.error('[ChatWindow] No active friend UID');
      return;
    }

    if (!socket || !socket.connected) {
      console.error('[ChatWindow] Socket not connected');
      // TODO: Show toast "Connection error"
      return;
    }

    if (isBusy()) {
      console.warn('[ChatWindow] Already in a call');
      // TODO: Show toast "Already in a call"
      return;
    }

    console.log('[ChatWindow] Starting video call with:', activeFriend.uid);

    // Update store state
    startOutgoingCall(
      activeFriend.uid,
      {
        username: displayInfoWithPresence.name,
        avatar: displayInfoWithPresence.avatar,
      },
      CALL_TYPE.VIDEO
    );

    // Emit socket event
    callSocketService.startCall(activeFriend.uid, CALL_TYPE.VIDEO);
  };

  // ============================================
  // 🔥 NEW: CONVERSATION INFO HANDLER
  // ============================================
  
  /**
   * Handle info button click (3 dots menu)
   */
  const handleInfoClick = () => {
    console.log('[ChatWindow] Opening conversation info');
    setShowConversationInfo(true);
  };

  /**
   * Handle close conversation info modal
   */
  const handleCloseInfo = () => {
    console.log('[ChatWindow] Closing conversation info');
    setShowConversationInfo(false);
  };

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
          onCallClick={handleVoiceCall}
          onVideoClick={handleVideoCall}
          onInfoClick={handleInfoClick} // 🔥 Pass handler
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
    <div className="flex flex-col h-full w-full min-h-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Header with Real-time Presence & Call Buttons */}
      <ChatWindowHeader
        receiverName={displayInfoWithPresence.name}
        receiverAvatar={displayInfoWithPresence.avatar}
        isTyping={!!typingUser}
        typingUserName={typingUser?.nickname || typingUser?.fullName}
        isOnline={displayInfoWithPresence.isOnline}
        lastSeen={displayInfoWithPresence.lastSeen}
        showBackButton={true}
        onBackClick={handleBackClick}
        onCallClick={handleVoiceCall}
        onVideoClick={handleVideoCall}
        onInfoClick={handleInfoClick} // 🔥 Pass handler
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
            ? t("input.startConversation")
            : t("input.placeholder")
        }
      />

      {/* 🔥 Conversation Info Modal - FIXED POSITIONING */}
      {showConversationInfo && (
        <>
          {/* Mobile: Full Screen Overlay */}
          <div className="lg:hidden fixed inset-0 z-9999 bg-white">
            <ConversationInfo onClose={handleCloseInfo} />
          </div>

          {/* Desktop: Half Screen Side Panel */}
          <div 
            className="hidden lg:block fixed inset-0 z-9999 bg-black/20" 
            onClick={handleCloseInfo}
          >
            <div 
              className="absolute right-0 top-0 bottom-0 w-1/2 bg-white shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ConversationInfo onClose={handleCloseInfo} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}