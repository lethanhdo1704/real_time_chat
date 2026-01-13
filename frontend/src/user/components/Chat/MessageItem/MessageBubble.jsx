// frontend/src/user/components/Chat/MessageItem/MessageBubble.jsx

import { useState, useEffect, useRef, useContext } from "react";
import { Check, X } from "lucide-react";
import { renderMessage } from "../../../utils/renderMessage";
import AttachmentsGrid from "./FileUpload/AttachmentsGrid"; 
import { AuthContext } from "../../../context/AuthContext";
import { useTranslation } from "react-i18next";

/**
 * MessageBubble Component - CLEAN VERSION
 * 
 * ✅ Links are clearly visible with proper contrast
 * ✅ Special styling for links in blue/gradient bubbles
 * ✅ Underline on hover for better UX
 * ✅ Avatar is now handled by MessageItem component
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
  // Edit props
  isEditing = false,
  onSaveEdit,
  onCancelEdit,
  editLoading = false,
  // Reaction props
  message,
  conversationId,
  onReactionClick,
  // Sender info (optional - may be used for future features)
  sender,
}) {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation("chat");
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
    return "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg";
  };

  const getTextColorClass = () => {
    if (isEditing) return "text-gray-900";
    if (!isMe) return "text-gray-800";
    if (isPending) return "text-white opacity-60";
    if (isFailed) return "text-red-800";
    return "text-white";
  };

  const truncateReply = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="inline-flex flex-col gap-2 max-w-full">
      {/* File attachments without text */}
      {hasAttachments && !hasText && !isEditing && (
        <div className="w-full">
          <AttachmentsGrid 
            attachments={attachments}
            isMe={isMe}
          />
        </div>
      )}

      {/* Text message with bubble */}
      {(hasText || isEditing) && (
        <div 
          className={`
            rounded-2xl ${getBubbleCorner()} 
            transition-all duration-300 ${getBubbleColor()} 
            overflow-hidden
            ${replyTo ? 'px-2.5 py-2 sm:px-3 sm:py-2' : hasAttachments ? 'p-0' : 'px-3 py-2 sm:px-4 sm:py-2.5'}
            message-bubble-container
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
                    {replyTo.sender?.nickname || t('message.unknownSender')}
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
                  placeholder={t('message.typePlaceholder')}
                  className="w-full min-h-15 max-h-75 px-0 py-0 text-[14px] sm:text-[15px] leading-[1.4] bg-transparent border-none outline-none resize-none text-gray-900 disabled:opacity-50"
                  style={{ 
                    fontFamily: "inherit",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}
                />
                
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-300">
                  <span className="text-xs text-gray-500">
                    {t("message.editHint")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onCancelEdit}
                      disabled={editLoading}
                      className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600 disabled:opacity-50 transition-all hover:scale-110"
                      title={t("actions.cancel")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={editLoading || !draftContent.trim() || draftContent.trim() === messageText.trim()}
                      className="p-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:scale-110"
                      title={t("actions.save")}
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
                  <div 
                    className={`
                      ${isBig ? "text-4xl leading-none" : "text-[14px] sm:text-[15px] leading-[1.4] whitespace-pre-wrap wrap-break-word"}
                      ${getTextColorClass()}
                      message-content-links
                    `}
                  >
                    {renderMessage(messageText)}
                  </div>
                )}
                
                {/* EDITED INDICATOR */}
                {editedAt && (
                  <span className={`text-[10px] mt-1 italic ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                    {t("message.edited")}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* INLINE STYLES FOR LINK VISIBILITY */}
      <style jsx>{`
        /* Link styles for messages from ME (blue background) */
        .message-bubble-container.bg-gradient-to-br a,
        .message-content-links.text-white a {
          color: #E0F2FE !important;
          text-decoration: underline;
          text-decoration-color: rgba(224, 242, 254, 0.5);
          text-underline-offset: 2px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .message-bubble-container.bg-gradient-to-br a:hover,
        .message-content-links.text-white a:hover {
          color: #FFFFFF !important;
          text-decoration-color: rgba(255, 255, 255, 0.8);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }

        /* Link styles for messages from OTHERS (white background) */
        .message-bubble-container.bg-white a,
        .message-content-links.text-gray-800 a {
          color: #2563EB !important;
          text-decoration: underline;
          text-decoration-color: rgba(37, 99, 235, 0.3);
          text-underline-offset: 2px;
          transition: all 0.2s ease;
        }

        .message-bubble-container.bg-white a:hover,
        .message-content-links.text-gray-800 a:hover {
          color: #1D4ED8 !important;
          text-decoration-color: rgba(29, 78, 216, 0.6);
        }

        /* Link styles for PENDING messages */
        .message-bubble-container.opacity-60 a {
          color: rgba(255, 255, 255, 0.9) !important;
          text-decoration: underline;
          text-decoration-color: rgba(255, 255, 255, 0.4);
        }

        /* Link styles for FAILED messages */
        .message-bubble-container.bg-red-100 a {
          color: #991B1B !important;
          text-decoration: underline;
          text-decoration-color: rgba(153, 27, 27, 0.3);
        }

        .message-bubble-container.bg-red-100 a:hover {
          color: #7F1D1D !important;
          text-decoration-color: rgba(127, 29, 29, 0.5);
        }
      `}</style>
    </div>
  );
}