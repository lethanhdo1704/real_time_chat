// frontend/src/user/components/Chat/ChatWindow/ChatWindow.jsx

import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import useChatWindowLogic from "../../../hooks/chat/useChatWindowLogic.js";
import ChatWindowHeader from "./ChatWindowHeader.jsx";
import ChatWindowBody from "./ChatWindowBody.jsx";
import ChatInput from "../ChatInput/ChatInput.jsx";
import ChatEmptyState from "../ChatEmptyState.jsx";
import ConversationInfo from "../ConversationInfo.jsx";
import useChatStore from "../../../store/chat/chatStore.js";
import useFriendStore from "../../../store/friendStore.js";
import useCallStore from "../../../store/call/callStore.js";
import callSocketService from "../../../services/socket/call.socket.js";
import { CALL_TYPE } from "../../../utils/call/callConstants.js";
import { useSocket } from "../../../context/SocketContext.jsx";

/**
 * ChatWindow Component - WITH RESIZABLE SIDE PANEL
 * 
 * ✅ ConversationInfo as resizable side panel (not overlay)
 * ✅ Draggable divider to resize
 * ✅ Min/Max width constraints
 * ✅ Smooth transitions
 * ✅ Mobile: Full screen overlay
 * ✅ Desktop: Resizable split view
 * ✅ Fixed: Scroll works properly, smooth resize
 */
export default function ChatWindow() {
  const { t } = useTranslation("chat");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Conversation Info Panel State
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400); // Default 400px
  const [isResizing, setIsResizing] = useState(false);

  // Panel constraints
  const MIN_PANEL_WIDTH = 320; // Minimum 320px
  const MAX_PANEL_WIDTH = 600; // Maximum 600px

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
  // 🔥 RESIZE HANDLERS - IMPROVED
  // ============================================
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const containerWidth = window.innerWidth;
    const newWidth = containerWidth - e.clientX;
    
    // Constrain width with smooth clamping
    const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth));
    setPanelWidth(clampedWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 🔥 Add global mouse listeners for resize using useEffect
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection while resizing
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none'; // 🔥 Prevent scroll during resize
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Reset cursor and text selection
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = ''; // 🔥 Re-enable pointer events
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

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
  // 🔥 CONVERSATION INFO HANDLER
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
          onCallClick={handleVoiceCall}
          onVideoClick={handleVideoCall}
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
  // RENDER: Main Chat Window WITH RESIZABLE PANEL
  // ============================================
  return (
    <>
      {/* Mobile: Full Screen Overlay */}
      {showConversationInfo && (
        <div className="lg:hidden fixed inset-0 z-9999 bg-white">
          <ConversationInfo onClose={handleCloseInfo} />
        </div>
      )}

      {/* Desktop: Split View with Resizable Panel */}
      <div className="hidden lg:flex h-full w-full relative overflow-hidden">
        {/* Chat Area - Dynamic Width */}
        <div 
          className="flex flex-col min-h-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50"
          style={{ 
            width: showConversationInfo ? `calc(100% - ${panelWidth}px)` : '100%',
            transition: isResizing ? 'none' : 'width 0.2s ease-out'
          }}
        >
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
            onInfoClick={handleInfoClick}
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
        </div>

        {/* 🔥 Resizable Divider - IMPROVED */}
        {showConversationInfo && (
          <div
            onMouseDown={handleMouseDown}
            className={`
              relative shrink-0 w-1 bg-gray-200
              hover:bg-blue-400 active:bg-blue-500
              transition-colors duration-150
              ${isResizing ? 'bg-blue-500' : ''}
            `}
            style={{
              cursor: 'col-resize',
              zIndex: 10 // Ensure divider is above content
            }}
          >
            {/* Visual indicator line */}
            <div 
              className={`
                absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 
                bg-blue-500 transition-opacity duration-150
                ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `}
            />
            
            {/* Wider invisible hit area for easier grabbing */}
            <div className="absolute inset-y-0 -left-3 -right-3" />
            
            {/* Resize indicator (dots) */}
            <div 
              className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                flex flex-col gap-1 opacity-0 hover:opacity-100 transition-opacity
                ${isResizing ? 'opacity-100' : ''}
              `}
            >
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
            </div>
          </div>
        )}

        {/* Conversation Info Panel - Dynamic Width */}
        {showConversationInfo && (
          <div 
            className="bg-white border-l border-gray-200 shrink-0 overflow-hidden"
            style={{ 
              width: `${panelWidth}px`,
              transition: isResizing ? 'none' : 'width 0.2s ease-out'
            }}
          >
            <ConversationInfo onClose={handleCloseInfo} />
          </div>
        )}
      </div>

      {/* Mobile: Regular Full Screen Chat (when panel closed) */}
      {!showConversationInfo && (
        <div className="lg:hidden flex flex-col h-full w-full min-h-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
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
            onInfoClick={handleInfoClick}
          />

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
        </div>
      )}
    </>
  );
}