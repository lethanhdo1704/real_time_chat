// components/chat/ChatWindow.jsx
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";
import socket from "../../socket";
import { messageService } from "../../services/messageService";
import { useChatSocket } from "../../hooks/useChatSocket";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  receiverId,
  receiverName,
  receiverAvatar,
  currentRoom,
  user,
}) {
  const { t } = useTranslation("chat");
  const { user: currentUser, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const isPrivateChat = !!receiverId;
  const isGroupChat = !!currentRoom;
  const activeUser = user || currentUser;

  // Add global style for emoji alignment
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .emoji {
        display: inline-block;
        vertical-align: middle;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Load messages
  useEffect(() => {
    if (!activeUser) return;

    const loadMessages = async () => {
      try {
        if (isPrivateChat && receiverId) {
          const data = await messageService.loadPrivateMessages(
            receiverId,
            token
          );
          setMessages(data);

          const hasUnread = data.some(
            (msg) =>
              msg.sender === receiverId &&
              msg.receiver === activeUser.uid &&
              !msg.read
          );

          if (hasUnread) {
            markAsRead();
          }
        } else if (isGroupChat && currentRoom) {
          const data = await messageService.loadGroupMessages(token);
          setMessages(data);
        }
      } catch (err) {
        console.error("Load messages error:", err);
      }
    };

    loadMessages();
  }, [activeUser, token, receiverId, currentRoom, isPrivateChat, isGroupChat]);

  // Mark messages as read
  const markAsRead = () => {
    if (!receiverId || !activeUser) return;

    socket.emit("markAsRead", {
      userId: activeUser.uid,
      friendId: receiverId,
    });
  };

  // Socket listeners
  useChatSocket({
    activeUser,
    receiverId,
    currentRoom,
    isPrivateChat,
    isGroupChat,
    onReceiveMessage: (msg) => {
      setMessages((prev) => [...prev, msg]);
    },
    onTypingChange: (typing) => {
      setIsTyping(typing);
    },
    onMessagesRead: (userId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender === activeUser.uid && msg.receiver === userId
            ? { ...msg, read: true }
            : msg
        )
      );
    },
    onMarkAsRead: markAsRead,
  });

  // Handle sending message
  const handleSendMessage = (text) => {
    if (isPrivateChat) {
      socket.emit("sendPrivateMessage", {
        senderId: activeUser.uid,
        receiverId,
        text,
      });
    } else if (isGroupChat) {
      socket.emit("sendMessage", {
        senderId: activeUser.uid,
        senderName: activeUser.nickname,
        text,
      });
    }
  };

  // Handle typing indicator
  const handleTypingChange = (typing) => {
    if (!isPrivateChat) return;

    socket.emit("typing", {
      senderId: activeUser.uid,
      receiverId,
      isTyping: typing,
    });
  };

  if (!activeUser) return null;

  // Empty state
  if (!isPrivateChat && !isGroupChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-linear-to-br from-gray-50 to-blue-50">
        <div className="text-center px-4">
          <svg
            className="w-24 h-24 mx-auto text-gray-300 mb-4"
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
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {t("home.welcome.title")}
          </h2>
          <p className="text-gray-500 mb-1">
            {t("home.welcome.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>{t("home.welcome.features.privateChat")}</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{t("home.welcome.features.groupChat")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-linear-to-br from-gray-50 to-blue-50 min-h-0">
      {/* Header */}
      {isPrivateChat && (
        <ChatHeader
          receiverName={receiverName}
          receiverAvatar={receiverAvatar}
          isTyping={isTyping}
        />
      )}

      {/* Messages List */}
      <MessageList
        messages={messages}
        activeUser={activeUser}
        isGroupChat={isGroupChat}
        isPrivateChat={isPrivateChat}
      />

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
      />
    </div>
  );
}