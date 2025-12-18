import { useEffect, useState } from "react";
import socket from "@/socket";
import { messageService } from "@/services/messageService";

export function useChatMessages({
  activeUser,
  receiverId,
  currentRoom,
  isPrivateChat,
  isGroupChat,
  token,
}) {
  const [messages, setMessages] = useState([]);

  // mark as read
  const markAsRead = () => {
    if (!receiverId || !activeUser) return;

    socket.emit("markAsRead", {
      userId: activeUser.uid,
      friendId: receiverId,
    });
  };

  // load messages
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
  }, [activeUser, receiverId, currentRoom, isPrivateChat, isGroupChat, token]);

  return { messages, setMessages, markAsRead };
}
