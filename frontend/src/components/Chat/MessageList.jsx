// components/chat/MessageList.jsx
import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

export default function MessageList({
  messages,
  activeUser,
  isGroupChat,
  isPrivateChat,
}) {
  const bottomRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div className="flex flex-col gap-2 w-full">
        {messages.map((msg, i) => {
          // ✅ FIX: msg.sender là object, cần truy cập msg.sender.uid
          const isMe =
            msg.sender?.uid === activeUser.uid ||
            msg.sender?.id === activeUser.uid ||
            msg.sender?._id === activeUser.uid ||
            msg.senderId === activeUser.uid;

          return (
            <MessageItem
              key={msg._id ?? `${msg.sender?.uid}-${msg.createdAt}-${i}`}
              message={msg}
              isMe={isMe}
              isGroupChat={isGroupChat}
              isPrivateChat={isPrivateChat}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}