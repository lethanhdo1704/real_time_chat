import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import socket from "../../socket";

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
  receiverId,
  receiverName,
  receiverAvatar,
  currentRoom,
  user,
}) {
  const { user: currentUser, token } = useContext(AuthContext);
  const [isTyping, setIsTyping] = useState(false);

  const isPrivateChat = !!receiverId;
  const isGroupChat = !!currentRoom;
  const activeUser = user || currentUser;

  useEmojiStyle();

  const { messages, setMessages, markAsRead } = useChatMessages({
    activeUser,
    receiverId,
    currentRoom,
    isPrivateChat,
    isGroupChat,
    token,
  });

  useChatSocket({
    activeUser,
    receiverId,
    currentRoom,
    isPrivateChat,
    isGroupChat,
    onReceiveMessage: (msg) => {
      setMessages((prev) => [...prev, msg]);
    },
    onTypingChange: setIsTyping,
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

  const handleTypingChange = (typing) => {
    if (!isPrivateChat) return;

    socket.emit("typing", {
      senderId: activeUser.uid,
      receiverId,
      isTyping: typing,
    });
  };

  if (!activeUser) return null;
  if (!isPrivateChat && !isGroupChat) return <ChatEmptyState />;

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-linear-to-br from-gray-50 to-blue-50">
      {isPrivateChat && (
        <ChatHeader
          receiverName={receiverName}
          receiverAvatar={receiverAvatar}
          isTyping={isTyping}
        />
      )}

      <MessageList
        messages={messages}
        activeUser={activeUser}
        isGroupChat={isGroupChat}
        isPrivateChat={isPrivateChat}
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
      />
    </div>
  );
}
