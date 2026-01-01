// frontend/src/components/Chat/MessageItem/MessageBubble.jsx
import { renderMessage } from "../../../utils/renderMessage";

/**
 * MessageBubble Component - With Reply Feature
 * 
 * ✅ Shows replied message at top of bubble
 * ✅ Clickable to scroll to original message
 * ✅ Visual distinction for reply section
 */
export default function MessageBubble({
  messageText,
  isBig,
  isMe,
  isPending,
  isFailed,
  isLastInGroup,
  editedAt,
  replyTo,
  onReplyClick,
  t,
}) {
  const getBubbleCorner = () => {
    return isMe 
      ? (isLastInGroup ? "rounded-br-md" : "rounded-br-lg")
      : (isLastInGroup ? "rounded-bl-md" : "rounded-bl-lg");
  };

  const getBubbleColor = () => {
    if (!isMe) return "bg-white text-gray-800 shadow-sm hover:shadow-md border border-gray-100";
    if (isPending) return "bg-blue-400 text-white opacity-60";
    if (isFailed) return "bg-red-100 text-red-800 border border-red-300";
    return "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md";
  };

  // 🔥 Truncate replied message content
  const truncateReply = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className={`inline-flex flex-col rounded-2xl ${getBubbleCorner()} transition-all duration-200 ${getBubbleColor()} ${replyTo ? 'px-2.5 py-2 sm:px-3 sm:py-2' : 'px-3 py-2 sm:px-4 sm:py-2.5'}`}>
      
      {/* 🔥 REPLIED MESSAGE SECTION */}
      {replyTo && (
        <div
          onClick={() => onReplyClick && onReplyClick(replyTo.messageId)}
          className={`
            mb-2 rounded-lg px-2.5 py-2 cursor-pointer
            border-l-3 transition-all duration-200
            ${isMe 
              ? 'bg-blue-600/20 border-blue-300 hover:bg-blue-600/30' 
              : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
            }
          `}
        >
          {/* Replied Author */}
          <div className="flex items-center gap-1.5 mb-1">
            <svg
              className={`h-3 w-3 shrink-0 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span className={`text-xs font-medium ${isMe ? 'text-blue-100' : 'text-gray-700'}`}>
              {replyTo.sender?.nickname || "Unknown"}
            </span>
          </div>

          {/* Replied Content */}
          <p className={`text-xs ${isMe ? 'text-blue-50' : 'text-gray-600'} line-clamp-2`}>
            {truncateReply(replyTo.content)}
          </p>
        </div>
      )}

      {/* MAIN MESSAGE CONTENT */}
      <div className={isBig ? "text-4xl leading-none" : "text-[14px] sm:text-[15px] leading-[1.4] whitespace-pre-wrap wrap-break-word"}>
        {renderMessage(messageText)}
      </div>
      
      {/* EDITED INDICATOR */}
      {editedAt && (
        <span className={`text-[10px] mt-1 italic ${isMe ? "text-blue-100" : "text-gray-400"}`}>
          {t("message.edited") || "edited"}
        </span>
      )}
    </div>
  );
}