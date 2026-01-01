// frontend/src/components/Chat/MessageList.jsx
import { useMemo } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import MessageItem from "./MessageItem/MessageItem";

export default function MessageList({
  messages,
  conversationId, // ✅ RECEIVE conversationId as prop
  activeUser,
  isGroupChat,
  isPrivateChat,
  onRetryMessage,
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "vi" ? vi : enUS;

  // ============================================
  // GROUP MESSAGES BY DATE
  // ============================================
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      
      if (!currentGroup || !isSameDay(currentGroup.date, msgDate)) {
        currentGroup = {
          date: msgDate,
          messages: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.messages.push(msg);
    });

    return groups;
  }, [messages]);

  // ============================================
  // FORMAT DATE SEPARATOR
  // ============================================
  const formatDateSeparator = (date) => {
    if (isToday(date)) {
      return i18n.language === "vi" ? "Hôm nay" : "Today";
    }
    if (isYesterday(date)) {
      return i18n.language === "vi" ? "Hôm qua" : "Yesterday";
    }
    return format(date, "EEEE, d MMMM yyyy", { locale });
  };

  // ============================================
  // RENDER
  // ============================================
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-1">
          
          {/* Date Separator */}
          <div className="mx-auto w-full max-w-3xl px-4">
            <div className="flex items-center justify-center my-4">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                <span className="text-xs font-medium text-gray-600">
                  {formatDateSeparator(group.date)}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          {group.messages.map((msg, msgIndex) => {
            const isMe =
              msg.sender?.uid === activeUser?.uid ||
              msg.sender?.id === activeUser?.uid ||
              msg.sender?._id === activeUser?.uid ||
              msg.senderId === activeUser?.uid;

            const showSender =
              isGroupChat &&
              !isMe &&
              (msgIndex === 0 ||
                group.messages[msgIndex - 1].sender?.uid !== msg.sender?.uid);

            const nextMessage = group.messages[msgIndex + 1];
            const isLastInGroup =
              !nextMessage || nextMessage.sender?.uid !== msg.sender?.uid;

            return (
              <div 
                key={msg._id || `${msg.sender?.uid}-${msg.createdAt}-${msgIndex}`} 
                className="mx-auto w-full max-w-3xl px-4"
              >
                <MessageItem
                  message={msg}
                  conversationId={conversationId}
                  isMe={isMe}
                  isGroupChat={isGroupChat}
                  isPrivateChat={isPrivateChat}
                  showSender={showSender}
                  isLastInGroup={isLastInGroup}
                  onRetryMessage={onRetryMessage}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}