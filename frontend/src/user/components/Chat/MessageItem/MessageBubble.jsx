// frontend/src/user/components/Chat/MessageItem/MessageBubble.jsx
import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { renderMessage } from "../../../utils/renderMessage";

/**
 * MessageBubble Component - With Reply and INLINE Edit Feature
 * 
 * ✅ Shows replied message at top of bubble
 * ✅ Clickable to scroll to original message
 * ✅ Visual distinction for reply section
 * ✅ 🆕 INLINE edit mode (textarea + Save/Cancel inside bubble)
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
  // 🆕 EDIT PROPS
  isEditing = false,
  onSaveEdit,
  onCancelEdit,
  editLoading = false,
}) {
  const [draftContent, setDraftContent] = useState(messageText);
  const textareaRef = useRef(null);

  // Reset draft content khi bắt đầu edit
  useEffect(() => {
    if (isEditing) {
      setDraftContent(messageText);
      // Auto-focus và đặt cursor ở cuối
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = messageText.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 50);
    }
  }, [isEditing, messageText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [draftContent, isEditing]);

  const handleSave = () => {
    const trimmed = draftContent.trim();
    if (trimmed && trimmed !== messageText.trim()) {
      onSaveEdit?.(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onCancelEdit?.();
    }
  };

  const getBubbleCorner = () => {
    return isMe 
      ? (isLastInGroup ? "rounded-br-md" : "rounded-br-lg")
      : (isLastInGroup ? "rounded-bl-md" : "rounded-bl-lg");
  };

  const getBubbleColor = () => {
    // Edit mode có style riêng
    if (isEditing) {
      return isMe 
        ? "bg-blue-50 text-gray-900 border-2 border-blue-400 shadow-lg"
        : "bg-gray-50 text-gray-900 border-2 border-gray-400 shadow-lg";
    }
    
    // Normal mode
    if (!isMe) return "bg-white text-gray-800 shadow-sm hover:shadow-md border border-gray-100";
    if (isPending) return "bg-blue-400 text-white opacity-60";
    if (isFailed) return "bg-red-100 text-red-800 border border-red-300";
    return "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md";
  };

  const truncateReply = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className={`inline-flex flex-col rounded-2xl ${getBubbleCorner()} transition-all duration-200 ${getBubbleColor()} ${replyTo ? 'px-2.5 py-2 sm:px-3 sm:py-2' : 'px-3 py-2 sm:px-4 sm:py-2.5'}`}>
      
      {/* 🔥 REPLIED MESSAGE SECTION */}
      {replyTo && !isEditing && (
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

      {/* ============================================ */}
      {/* MAIN MESSAGE CONTENT - 2 MODES              */}
      {/* ============================================ */}
      
      {isEditing ? (
        /* 🆕 EDIT MODE - Textarea + Save/Cancel */
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={editLoading}
            placeholder="Nhập tin nhắn..."
            className="w-full min-h-15 max-h-75 px-0 py-0 text-[14px] sm:text-[15px] leading-[1.4] bg-transparent border-none outline-none resize-none text-gray-900 disabled:opacity-50"
            style={{ 
              fontFamily: "inherit",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          />
          
          {/* Edit Actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-300">
            <span className="text-xs text-gray-500">
              {t("message.editHint") || "Enter để lưu • Esc để hủy"}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCancelEdit}
                disabled={editLoading}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600 disabled:opacity-50 transition-colors"
                title={t("actions.cancel") || "Hủy (Esc)"}
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={editLoading || !draftContent.trim() || draftContent.trim() === messageText.trim()}
                className="p-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title={t("actions.save") || "Lưu (Enter)"}
              >
                {editLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL MODE - Display message */
        <>
          <div className={isBig ? "text-4xl leading-none" : "text-[14px] sm:text-[15px] leading-[1.4] whitespace-pre-wrap wrap-break-word"}>
            {renderMessage(messageText)}
          </div>
          
          {/* EDITED INDICATOR */}
          {editedAt && (
            <span className={`text-[10px] mt-1 italic ${isMe ? "text-blue-100" : "text-gray-400"}`}>
              {t("message.edited") || "edited"}
            </span>
          )}
        </>
      )}
    </div>
  );
}