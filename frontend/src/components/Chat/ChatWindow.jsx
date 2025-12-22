// frontend/src/components/Chat/ChatWindow.jsx
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { messageService } from "../../services/messageService";

import { useChatSocket } from "../../hooks/useChatSocket";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useEmojiStyle } from "../../hooks/useEmojiStyle";

import {
  ChatHeader,
  MessageList,
  ChatInput,
  ChatEmptyState,
} from ".";

export default function ChatWindow({
  conversation,
  onUpdateSidebar,
}) {
  const { user, token } = useContext(AuthContext);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEmojiStyle();

  const conversationId = conversation?.conversationId;
  const friend = conversation?.friend;

  // Load and manage messages
  const {
    messages,
    loading,
    hasMore,
    addMessage,
    updateMessageReadStatus,
  } = useChatMessages(conversationId);

  // Handle socket events
  const { emitTyping, emitMessageRead } = useChatSocket({
    activeConversationId: conversationId,
    onMessageReceived: (message) => {
      console.log("🔔 Socket received message:", message);
      addMessage(message);
      scrollToBottom();
      
      // Auto mark as read if message is from other user
      if (message.sender?.uid !== user.uid) {
        setTimeout(() => {
          emitMessageRead(conversationId, message._id);
        }, 500);
      }
    },
    onTyping: (typingUserData, isTyping) => {
      if (isTyping) {
        setTypingUser(typingUserData);
        setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    },
    onMessageRead: (readByUser, lastSeenMessage) => {
      updateMessageReadStatus(readByUser.uid, lastSeenMessage);
    },
    onUpdateSidebar: (convId, lastMessage) => {
      if (onUpdateSidebar) {
        onUpdateSidebar(convId, lastMessage);
      }
    },
  });

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages load or new message arrives
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [messages.length, conversationId]);

  // Handle send message
  const handleSendMessage = async (text) => {
    if (!conversationId || !text.trim()) return;

    try {
      const response = await messageService.sendMessage(
        conversationId,
        text.trim(),
        token
      );

      console.log("✅ Message sent, response:", response);

      // ✅ FIX: Thêm tin nhắn ngay lập tức (optimistic update)
      // Socket sẽ emit cho tất cả users trong room, bao gồm cả người gửi
      addMessage(response);
      scrollToBottom();

    } catch (error) {
      console.error("❌ Send message error:", error);
    }
  };
  
  // Handle typing indicator
  const handleTypingChange = (isTyping) => {
    if (!conversationId) return;
    emitTyping(conversationId, isTyping);
  };

  // Show empty state if no conversation selected
  if (!conversation) {
    return <ChatEmptyState />;
  }
  
  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-linear-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <ChatHeader
        receiverName={friend?.nickname}
        receiverAvatar={friend?.avatar}
        isTyping={!!typingUser}
      />

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Load more button */}
            {hasMore && (
              <div className="text-center py-2">
                <button
                  onClick={() => {/* loadMoreMessages will be added */}}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load older messages"}
                </button>
              </div>
            )}

            <MessageList
              messages={messages}
              activeUser={user}
              isPrivateChat={true}
            />

            {/* Typing indicator */}
            {typingUser && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                </div>
                <span>{friend?.nickname} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
        disabled={!conversationId}
      />
    </div>
  );
}