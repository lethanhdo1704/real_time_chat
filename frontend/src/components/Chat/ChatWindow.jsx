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

export default function ChatWindow({ conversation, onUpdateSidebar }) {
  const { user, token } = useContext(AuthContext);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEmojiStyle();

  const conversationId = conversation?.conversationId || conversation?._id;
  const friend = conversation?.friend;

  const {
    messages,
    loading,
    hasMore,
    addMessage,
    updateMessageReadStatus,
    loadMoreMessages,
  } = useChatMessages(conversationId);

  // ✅ UPDATED: Removed onUpdateSidebar from useChatSocket
  // Global updates are now handled by useGlobalSocket in Home.jsx
  const { emitTyping, emitMessageRead } = useChatSocket({
    activeConversationId: conversationId,
    
    onMessageReceived: (message) => {
      addMessage(message);
      setTimeout(() => scrollToBottom(), 100);
      
      // ✅ Still update sidebar for messages in active chat
      if (onUpdateSidebar) {
        onUpdateSidebar(conversationId, message);
      }
      
      if (message.sender?.uid !== user?.uid) {
        setTimeout(() => {
          emitMessageRead(conversationId, message.messageId);
        }, 500);
      }
    },
    
    onTyping: (typingUserData, isTyping) => {
      if (typingUserData?.uid !== user?.uid) {
        if (isTyping) {
          setTypingUser(typingUserData);
          setTimeout(() => setTypingUser(null), 3000);
        } else {
          setTypingUser(null);
        }
      }
    },
    
    onMessageRead: (readByUser, lastSeenMessage) => {
      if (readByUser?.uid !== user?.uid) {
        updateMessageReadStatus(readByUser.uid, lastSeenMessage);
      } 
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && !loading) {
      setTimeout(() => scrollToBottom(), 100);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, loading]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearTop = scrollTop < 100;
      
      if (isNearTop && hasMore && !loading && !isLoadingMore) {
        setIsLoadingMore(true);
        const previousScrollHeight = scrollHeight;
        
        try {
          await loadMoreMessages();
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeight;
            container.scrollTop = scrollTop + scrollDiff;
          }, 50);
        } catch (error) {
          console.error('Failed to load more messages:', error);
        } finally {
          setIsLoadingMore(false);
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, isLoadingMore, loadMoreMessages]);

  const handleSendMessage = async (text) => {
    if (!conversationId || !text.trim()) {
      console.warn('⚠️ [ChatWindow] Cannot send: missing conversationId or empty text');
      return;
    }

    try {
      const sentMessage = await messageService.sendMessage(
        conversationId,
        text.trim(),
        token
      );
    } catch (error) {
      console.error("❌ [ChatWindow] Send message error:", error);
      alert(`Failed to send message: ${error.message}`);
    }
  };

  const handleTypingChange = (isTyping) => {
    if (!conversationId) return;
    emitTyping(conversationId, isTyping);
  };

  if (!conversation || !conversationId) {
    return <ChatEmptyState />;
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-linear-to-br from-gray-50 to-blue-50">
      <ChatHeader
        receiverName={friend?.nickname || 'Unknown'}
        receiverAvatar={friend?.avatar}
        isTyping={!!typingUser}
      />

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {isLoadingMore && hasMore && (
              <div className="flex justify-center py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more messages...</span>
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <MessageList
                messages={messages}
                activeUser={user}
                isPrivateChat={conversation.type === 'private'}
              />
            )}

            {typingUser && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 animate-fadeIn">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                </div>
                <span>{friend?.nickname || 'Someone'} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
        disabled={!conversationId}
      />
    </div>
  );
}