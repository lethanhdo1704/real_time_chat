// frontend/src/user/components/Chat/MessageItem/MessageBubble.jsx

import { useState, useEffect, useRef, useContext } from "react";
import { Check, X } from "lucide-react";
import { renderMessage } from "../../../utils/renderMessage";
import MessageReactions from "./MessageReactions";
import AttachmentsGrid from "./AttachmentsGrid"; // 🔥 NEW IMPORT
import { AuthContext } from "../../../context/AuthContext";

/**
 * MessageBubble Component - WITH ATTACHMENTS OUTSIDE BUBBLE
 * 
 * ✅ Attachments render FIRST, outside the bubble (Telegram/Messenger style)
 * ✅ Text bubble only shows if there's text content
 * ✅ File-only messages have no colored bubble
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
  // Edit props
  isEditing = false,
  onSaveEdit,
  onCancelEdit,
  editLoading = false,
  // Reaction props
  message,
  conversationId,
  onReactionClick,
}) {
  const { user } = useContext(AuthContext);
  const [draftContent, setDraftContent] = useState(messageText);
  const textareaRef = useRef(null);

  // Extract attachments
  const attachments = message?.attachments || [];
  const hasAttachments = attachments.length > 0;
  const hasText = messageText && messageText.trim().length > 0;

  // Reset draft content when editing starts
  useEffect(() => {
    if (isEditing) {
      setDraftContent(messageText);
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
    if (isEditing) {
      return isMe 
        ? "bg-blue-50 text-gray-900 border-2 border-blue-400 shadow-lg"
        : "bg-gray-50 text-gray-900 border-2 border-gray-400 shadow-lg";
    }
    
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
    <div className="inline-flex flex-col gap-1.5 max-w-full">
      {/* 🎯 TELEGRAM-STYLE: File without bubble, text with bubble */}
      
      {/* Case 1: File-only message (NO BUBBLE) */}
      {hasAttachments && !hasText && !isEditing && (
        <div className="w-full">
          <AttachmentsGrid 
            attachments={attachments}
            isMe={isMe}
          />
        </div>
      )}

      {/* Case 2: Text message (WITH BUBBLE) */}
      {(hasText || isEditing) && (
        <div 
          className={`
            rounded-2xl ${getBubbleCorner()} 
            transition-all duration-200 ${getBubbleColor()} 
            overflow-hidden
            ${replyTo ? 'px-2.5 py-2 sm:px-3 sm:py-2' : hasAttachments ? 'p-0' : 'px-3 py-2 sm:px-4 sm:py-2.5'}
          `}
        >
          {/* File INSIDE bubble (when has text) */}
          {hasAttachments && hasText && !isEditing && (
            <div className="mb-0">
              <AttachmentsGrid 
                attachments={attachments}
                isMe={isMe}
              />
            </div>
          )}

          {/* Divider between file and text */}
          {hasAttachments && hasText && !isEditing && (
            <div className={`h-px ${isMe ? 'bg-blue-400/30' : 'bg-gray-200'} my-0`} />
          )}

          {/* Text content wrapper */}
          <div className={hasAttachments && hasText ? 'px-3 py-2 sm:px-4 sm:py-2.5' : ''}>
            {/* Replied Message Section */}
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
                <p className={`text-xs ${isMe ? 'text-blue-50' : 'text-gray-600'} line-clamp-2`}>
                  {truncateReply(replyTo.content)}
                </p>
              </div>
            )}

            {/* Main Text Content */}
            {isEditing ? (
              /* EDIT MODE */
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
              /* NORMAL MODE - TEXT ONLY */
              <>
                {hasText && (
                  <div className={isBig ? "text-4xl leading-none" : "text-[14px] sm:text-[15px] leading-[1.4] whitespace-pre-wrap wrap-break-word"}>
                    {renderMessage(messageText)}
                  </div>
                )}
                
                {/* EDITED INDICATOR */}
                {editedAt && (
                  <span className={`text-[10px] mt-1 italic ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                    {t("message.edited") || "edited"}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 🚫 REACTIONS REMOVED - MessageItem will handle it */}
    </div>
  );
}