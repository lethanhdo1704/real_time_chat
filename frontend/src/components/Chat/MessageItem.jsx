// frontend/src/components/Chat/MessageItem.jsx
import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { isBigEmoji } from "../../utils/emoji";
import { renderMessage } from "../../utils/renderMessage";

/**
 * MessageItem Component
 * 
 * Individual message bubble with:
 * - Big emoji support (4x size for 1-3 emojis)
 * - Read status for private chats
 * - Sender info for group chats
 * - Hover actions (future: edit/delete/reply)
 * - Optimistic UI support (pending state)
 */
export default function MessageItem({
  message,
  isMe,
  isGroupChat,
  isPrivateChat,
  showSender = false,
  isLastInGroup = true,
}) {
  const { t } = useTranslation("chat");
  const [showActions, setShowActions] = useState(false);

  // ============================================
  // MESSAGE CONTENT
  // ============================================

  const messageText = message.content || message.text || "";
  const isBig = isBigEmoji(messageText);
  const isPending = message.status === "pending"; // Optimistic UI
  const isFailed = message.status === "failed";

  // ============================================
  // SENDER INFO (GROUP CHAT)
  // ============================================

  const getSenderInfo = () => {
    if (!showSender || isMe) return null;

    return {
      name: message.sender?.nickname || message.sender?.fullName || "Unknown",
      avatar: message.sender?.avatar,
    };
  };

  const senderInfo = getSenderInfo();

  // ============================================
  // READ STATUS (PRIVATE CHAT)
  // ============================================

  const getReadStatus = () => {
    if (!isMe || !isPrivateChat) return null;

    if (isFailed) {
      return {
        icon: "⚠️",
        text: t("message.failed") || "Failed",
        color: "text-red-500",
      };
    }

    if (isPending) {
      return {
        icon: "⏱",
        text: t("message.sending") || "Sending...",
        color: "text-gray-400",
      };
    }

    if (message.read || message.readBy?.length > 0) {
      return {
        icon: "✓✓",
        text: t("message.read") || "Read",
        color: "text-blue-500",
      };
    }

    return {
      icon: "✓",
      text: t("message.sent") || "Sent",
      color: "text-gray-400",
    };
  };

  const readStatus = getReadStatus();

  // ============================================
  // FORMAT TIME
  // ============================================

  const formatTime = (date) => {
    try {
      return format(new Date(date), "HH:mm");
    } catch {
      return "";
    }
  };

  // ============================================
  // BUBBLE STYLE (GROUPED MESSAGES)
  // ============================================

  const getBubbleStyle = () => {
    if (isMe) {
      return isLastInGroup ? "rounded-br-md" : "rounded-br-lg";
    } else {
      return isLastInGroup ? "rounded-bl-md" : "rounded-bl-lg";
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* ALIGN WRAPPER */}
      <div
        className={`flex w-full flex-col ${
          isMe ? "items-end" : "items-start"
        } max-w-[75%]`}
      >
        {/* Sender Avatar & Name (Group Chat) */}
        {senderInfo && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden shrink-0">
              {senderInfo.avatar ? (
                <img
                  src={senderInfo.avatar}
                  alt={senderInfo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                senderInfo.name[0]?.toUpperCase() || "?"
              )}
            </div>
            <span className="text-xs font-medium text-gray-600">
              {senderInfo.name}
            </span>
          </div>
        )}

        {/* Message Bubble Container */}
        <div className="flex items-end gap-2">
          {/* Action Buttons (Left side for received, right side for sent) */}
          {!isMe && showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Reply"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            </div>
          )}

          {/* MESSAGE BUBBLE */}
          <div
            className={`
              inline-flex flex-col rounded-2xl ${getBubbleStyle()}
              px-4 py-2.5 transition-all duration-200
              ${
                isMe
                  ? isPending
                    ? "bg-blue-400 text-white opacity-60"
                    : isFailed
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-blue-500 text-white shadow-sm hover:shadow-md"
                  : "bg-white text-gray-800 shadow-sm hover:shadow-md border border-gray-100"
              }
            `}
          >
            {/* Message Content */}
            <div
              className={
                isBig
                  ? "text-4xl leading-none"
                  : "text-[15px] leading-[1.4] whitespace-pre-wrap break-words"
              }
            >
              {renderMessage(messageText)}
            </div>

            {/* Edited Badge */}
            {message.editedAt && (
              <span
                className={`text-[10px] mt-1 italic ${
                  isMe ? "text-blue-100" : "text-gray-400"
                }`}
              >
                {t("message.edited") || "edited"}
              </span>
            )}
          </div>

          {/* Action Buttons (Right side for sent messages) */}
          {isMe && showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Timestamp & Status */}
        <div
          className={`mt-1 flex items-center gap-1.5 text-[11px] px-1 ${
            isMe ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-gray-400">
            {formatTime(message.createdAt)}
          </span>

          {/* Read Status (Private Chat) */}
          {readStatus && (
            <span className={`flex items-center gap-1 ${readStatus.color} font-medium`}>
              <span>{readStatus.icon}</span>
              <span>{readStatus.text}</span>
            </span>
          )}

          {/* Retry Button (Failed Messages) */}
          {isFailed && (
            <button
              className="ml-1 text-red-500 hover:text-red-700 underline text-[10px]"
              onClick={() => {
                // TODO: Implement retry logic
                console.log("Retry sending message:", message._id);
              }}
            >
              {t("message.retry") || "Retry"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}