// hooks/useChatSocket.js
import { useEffect, useRef } from "react";
import socket from "../socket";

export const useChatSocket = ({
  activeUser,
  receiverId,
  currentRoom,
  isPrivateChat,
  isGroupChat,
  onReceiveMessage,
  onTypingChange,
  onMessagesRead,
  onMarkAsRead,
}) => {
  const markedAsReadRef = useRef(false);

  useEffect(() => {
    if (!activeUser) return;

    markedAsReadRef.current = false;
  }, [activeUser, receiverId, currentRoom]);

  useEffect(() => {
    if (!activeUser) return;

    if (isPrivateChat) {
      const handleReceiveMessage = (msg) => {
        if (
          (msg.sender === activeUser.uid && msg.receiver === receiverId) ||
          (msg.sender === receiverId && msg.receiver === activeUser.uid)
        ) {
          onReceiveMessage(msg);

          if (msg.sender === receiverId && !markedAsReadRef.current) {
            markedAsReadRef.current = true;

            setTimeout(() => {
              onMarkAsRead();
              markedAsReadRef.current = false;
            }, 500);
          }
        }
      };

      const handleTyping = ({ userId, isTyping }) => {
        if (userId === receiverId) {
          onTypingChange(isTyping);
        }
      };

      const handleMessagesRead = ({ userId }) => {
        if (userId === receiverId) {
          onMessagesRead(userId);
        }
      };

      socket.on("receivePrivateMessage", handleReceiveMessage);
      socket.on("userTyping", handleTyping);
      socket.on("messagesRead", handleMessagesRead);

      return () => {
        socket.off("receivePrivateMessage", handleReceiveMessage);
        socket.off("userTyping", handleTyping);
        socket.off("messagesRead", handleMessagesRead);
      };
    } else if (isGroupChat) {
      socket.on("receiveMessage", (msg) => {
        onReceiveMessage(msg);
      });

      return () => socket.off("receiveMessage");
    }
  }, [
    activeUser,
    receiverId,
    currentRoom,
    isPrivateChat,
    isGroupChat,
    onReceiveMessage,
    onTypingChange,
    onMessagesRead,
    onMarkAsRead,
  ]);

  return { markedAsReadRef };
};