// frontend/src/components/Chat/MessageItem/MessageItem.jsx
import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { isBigEmoji } from "../../../utils/emoji";
import MessageSenderInfo from "./MessageSenderInfo";
import MessageBubble from "./MessageBubble";
import MessageActions from "./MessageActions";
import MessageStatus from "./MessageStatus";

export default function MessageItem({
  message,
  isMe,
  isGroupChat,
  isPrivateChat,
  showSender = false,
  isLastInGroup = true,
  onRetryMessage,
}) {
  const { t } = useTranslation("chat");

  // ============================================
  // MESSAGE DATA
  // ============================================
  const messageText = message.content || message.text || "";
  const isBig = isBigEmoji(messageText);
  const isPending = message.status === "pending";
  const isFailed = message.status === "failed";

  // ============================================
  // SENDER INFO
  // ============================================
  const senderInfo = !showSender || isMe ? null : {
    name: message.sender?.nickname || message.sender?.fullName || "Unknown",
    avatar: message.sender?.avatar,
  };

  // ============================================
  // READ STATUS
  // ============================================
  const getReadStatus = () => {
    if (!isMe || !isPrivateChat) return null;

    if (isFailed) {
      return { icon: "⚠️", text: t("message.failed") || "Failed", color: "text-red-500" };
    }
    if (isPending) {
      return { icon: "⏱", text: t("message.sending") || "Sending...", color: "text-gray-400" };
    }
    if (message.read || message.readBy?.length > 0) {
      return { icon: "✓✓", text: t("message.read") || "Read", color: "text-blue-500" };
    }
    return { icon: "✓", text: t("message.sent") || "Sent", color: "text-gray-400" };
  };

  const readStatus = getReadStatus();

  // ============================================
  // HANDLERS
  // ============================================
  const handleReply = () => {
    console.log("Reply to message:", message._id);
    // TODO: Implement reply logic
  };

  const handleEdit = () => {
    console.log("Edit message:", message._id);
    // TODO: Implement edit logic
  };

  const handleDelete = () => {
    console.log("Delete message:", message._id);
    // TODO: Implement delete logic
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
  };

  const handleForward = () => {
    console.log("Forward message:", message._id);
    // TODO: Implement forward logic
  };

  const handleRetry = () => {
    if (onRetryMessage) {
      onRetryMessage(message);
    }
  };

  const formatTime = (date) => {
    try {
      return format(new Date(date), "HH:mm");
    } catch {
      return "";
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group relative`}>
      <div className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
        
        {/* Sender Info */}
        {senderInfo && <MessageSenderInfo {...senderInfo} />}

        {/* Message Bubble with Actions */}
        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <MessageBubble
            messageText={messageText}
            isBig={isBig}
            isMe={isMe}
            isPending={isPending}
            isFailed={isFailed}
            isLastInGroup={isLastInGroup}
            editedAt={message.editedAt}
            t={t}
          />
          
          <MessageActions
            isMe={isMe}
            isFailed={isFailed}
            onReply={handleReply}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onForward={handleForward}
          />
        </div>

        {/* Status */}
        <MessageStatus
          time={formatTime(message.createdAt)}
          readStatus={readStatus}
          isFailed={isFailed}
          isMe={isMe}
          onRetry={handleRetry}
          t={t}
        />
      </div>
    </div>
  );
}
