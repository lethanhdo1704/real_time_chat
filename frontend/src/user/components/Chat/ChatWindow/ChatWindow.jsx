// frontend/src/components/Chat/ChatWindow/ChatWindow.jsx - UPDATED WITH NEW STRUCTURE

import { useRef, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import useChatWindowLogic from "../../../hooks/chat/useChatWindowLogic.js";
import ChatWindowHeader from "./ChatWindowHeader.jsx";
import ChatWindowBody from "./ChatWindowBody.jsx";
import ChatInput from "../ChatInput/ChatInput.jsx";
import ChatEmptyState from "../ChatEmptyState.jsx";
import ConversationInfo from "../ConversationInfo/index.jsx"; // 🔥 UPDATED PATH
import useChatStore from "../../../store/chat/chatStore.js";
import useFriendStore from "../../../store/friendStore.js";
import useCallStore from "../../../store/call/callStore.js";
import callSocketService from "../../../services/socket/call.socket.js";
import { CALL_TYPE } from "../../../utils/call/callConstants.js";
import { useSocket } from "../../../context/SocketContext.jsx";
import useGroupPermissions from "../../../hooks/chat/useGroupPermissions.js";

/**
 * ChatWindow Component - WITH GROUP SUPPORT
 * 
 * ✅ Group permission checks
 * ✅ Kicked/left member banner
 * ✅ System message support
 * ✅ Call functionality
 * ✅ Conversation info modal (NEW STRUCTURE)
 */
export default function ChatWindow() {
  const { t } = useTranslation("chat");
  const { user } = useContext(AuthContext);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [showConversationInfo, setShowConversationInfo] = useState(false);

  const { socket } = useSocket();

  // ============================================
  // GET CONVERSATION DATA
  // ============================================
  const conversationId = useChatStore((state) => state.activeConversationId);
  const activeFriend = useChatStore((state) => state.activeFriend);
  const conversations = useChatStore((state) => state.conversations);
  const conversation = conversations.get(conversationId);

  // ============================================
  // 🔥 GROUP PERMISSIONS
  // ============================================
  const {
    isGroup,
    memberStatus,
    kickedBy,
    kickedAt,
  } = useGroupPermissions(conversationId, user?.uid);

  // ============================================
  // GET FRIEND PRESENCE
  // ============================================
  const getFriend = useFriendStore((state) => state.getFriend);
  const friendPresence = activeFriend?.uid ? getFriend(activeFriend.uid) : null;

  // ============================================
  // CALL STORE
  // ============================================
  const startOutgoingCall = useCallStore((state) => state.startOutgoingCall);
  const isBusy = useCallStore((state) => state.isBusy);

  // ============================================
  // GET CHAT DATA
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
  // MERGE PRESENCE DATA
  // ============================================
  const displayInfoWithPresence = displayInfo ? {
    ...displayInfo,
    isOnline: friendPresence?.isOnline ?? activeFriend?.isOnline ?? displayInfo.isOnline ?? false,
    lastSeen: friendPresence?.lastSeen ?? activeFriend?.lastSeen ?? displayInfo.lastSeen ?? null,
  } : null;

  // ============================================
  // CALL HANDLERS
  // ============================================
  
  const handleVoiceCall = () => {
    if (!activeFriend?.uid) {
      console.error('[ChatWindow] No active friend UID');
      return;
    }

    if (!socket || !socket.connected) {
      console.error('[ChatWindow] Socket not connected');
      return;
    }

    if (isBusy()) {
      console.warn('[ChatWindow] Already in a call');
      return;
    }

    console.log('[ChatWindow] Starting voice call with:', activeFriend.uid);

    startOutgoingCall(
      activeFriend.uid,
      {
        username: displayInfoWithPresence.name,
        avatar: displayInfoWithPresence.avatar,
      },
      CALL_TYPE.VOICE
    );

    callSocketService.startCall(activeFriend.uid, CALL_TYPE.VOICE);
  };

  const handleVideoCall = () => {
    if (!activeFriend?.uid) {
      console.error('[ChatWindow] No active friend UID');
      return;
    }

    if (!socket || !socket.connected) {
      console.error('[ChatWindow] Socket not connected');
      return;
    }

    if (isBusy()) {
      console.warn('[ChatWindow] Already in a call');
      return;
    }

    console.log('[ChatWindow] Starting video call with:', activeFriend.uid);

    startOutgoingCall(
      activeFriend.uid,
      {
        username: displayInfoWithPresence.name,
        avatar: displayInfoWithPresence.avatar,
      },
      CALL_TYPE.VIDEO
    );

    callSocketService.startCall(activeFriend.uid, CALL_TYPE.VIDEO);
  };

  // ============================================
  // CONVERSATION INFO HANDLERS
  // ============================================
  
  const handleInfoClick = () => {
    console.log('[ChatWindow] Opening conversation info');
    setShowConversationInfo(true);
  };

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
    
    useChatStore.getState().exitConversation();
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
          onCallClick={!isGroup ? handleVoiceCall : null}
          onVideoClick={!isGroup ? handleVideoCall : null}
          onInfoClick={handleInfoClick}
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
  // 🔥 RENDER KICKED/LEFT BANNER
  // ============================================
  const renderKickedBanner = () => {
    if (memberStatus !== 'kicked' && memberStatus !== 'left') return null;

    const isKicked = memberStatus === 'kicked';

    return (
      <div className="flex-1 flex items-center justify-center px-4 bg-linear-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-red-200">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isKicked
              ? t("group.youWereKicked") || "Bạn đã bị kick khỏi nhóm"
              : t("group.youLeftGroup") || "Bạn đã rời nhóm"
            }
          </h3>

          {isKicked && kickedBy && (
            <p className="text-gray-600 mb-4">
              {t("group.kickedBy", { name: kickedBy.nickname || "Admin" })}
            </p>
          )}

          {isKicked && kickedAt && (
            <p className="text-sm text-gray-500 mb-6">
              {new Date(kickedAt).toLocaleString()}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleBackClick}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              {t("group.backToConversations") || "Quay lại danh sách"}
            </button>

            {isKicked && (
              <p className="text-xs text-gray-500">
                {t("group.contactAdminToRejoin") || "Liên hệ quản trị viên để tham gia lại"}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER: Main Chat Window
  // ============================================
  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Header */}
      <ChatWindowHeader
        receiverName={displayInfoWithPresence.name}
        receiverAvatar={displayInfoWithPresence.avatar}
        isTyping={!!typingUser}
        typingUserName={typingUser?.nickname || typingUser?.fullName}
        isOnline={displayInfoWithPresence.isOnline}
        lastSeen={displayInfoWithPresence.lastSeen}
        showBackButton={true}
        onBackClick={handleBackClick}
        onCallClick={!isGroup ? handleVoiceCall : null}
        onVideoClick={!isGroup ? handleVideoCall : null}
        onInfoClick={handleInfoClick}
      />

      {/* 🔥 Body or Kicked Banner */}
      {memberStatus === 'kicked' || memberStatus === 'left' ? (
        renderKickedBanner()
      ) : (
        <>
          {/* Body: Messages */}
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
        </>
      )}

      {/* 🔥 Conversation Info Modal - NEW STRUCTURE */}
      {showConversationInfo && (
        <>
          {/* Mobile: Full Screen */}
          <div className="lg:hidden fixed inset-0 z-9999 bg-white">
            <ConversationInfo onClose={handleCloseInfo} />
          </div>

          {/* Desktop: Half Screen */}
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