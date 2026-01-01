// frontend/src/components/Chat/ChatInput.jsx
import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import EmojiPicker from "./EmojiPicker";
import useChatStore from "../../store/chat/chatStore";

/**
 * ChatInput Component - With Reply Feature
 * 
 * ✅ Reply preview UI
 * ✅ Clear reply button
 * ✅ Focus input after setting reply
 * ✅ Pass replyTo to sendMessage
 * ✅ FIXED: Use activeConversationId (string) from store
 */
const ChatInput = forwardRef(({ 
  onSendMessage, 
  onTypingChange,
  onImageSelect,
  disabled = false,
  sending = false,
  placeholder,
}, ref) => {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // ============================================
  // 🔥 REPLY STATE (FIXED - use activeConversationId)
  // ============================================
  const conversationId = useChatStore((state) => state.activeConversationId);
  const clearReplyingTo = useChatStore((state) => state.clearReplyingTo);

  // ✅ Get reply state using conversationId
  const replyingTo = useChatStore((state) => 
    conversationId ? state.replyingTo.get(conversationId) : null
  );

  // ============================================
  // EXPOSE FOCUS METHOD TO PARENT
  // ============================================
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }));

  // ============================================
  // AUTO FOCUS ON MOUNT
  // ============================================
  useEffect(() => {
    if (!disabled && !sending && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [disabled, sending]);

  // ============================================
  // 🔥 AUTO FOCUS WHEN REPLY IS SET
  // ============================================
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [replyingTo]);

  // ============================================
  // GLOBAL KEYDOWN → AUTO FOCUS
  // ============================================
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (disabled || sending) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      if (e.key.length === 1) {
        textareaRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [disabled, sending]);

  // ============================================
  // EMOJI PICKER
  // ============================================
  const handleEmojiClick = useCallback((emojiObject) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const emoji = emojiObject.emoji;
    
    const currentText = textarea.value;
    const newText = currentText.substring(0, start) + emoji + currentText.substring(end);

    setText(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);

      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }, 0);
  }, []);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

  // ============================================
  // IMAGE UPLOAD
  // ============================================
  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0 && onImageSelect) {
      onImageSelect(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageSelect]);

  // ============================================
  // TEXT CHANGE WITH TYPING INDICATOR
  // ============================================
  const handleTextChange = useCallback((e) => {
    const value = e.target.value;
    setText(value);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 180);
      textarea.style.height = newHeight + "px";
    }

    if (onTypingChange && value.trim()) {
      onTypingChange(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingChange) {
        onTypingChange(false);
      }
    }, 1000);
  }, [onTypingChange]);

  // ============================================
  // 🔥 CLEAR REPLY
  // ============================================
  const handleClearReply = useCallback(() => {
    if (conversationId) {
      console.log("🧹 [ChatInput] Clearing reply for:", conversationId);
      clearReplyingTo(conversationId);
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [conversationId, clearReplyingTo]);

  // ============================================
  // 🔥 SEND MESSAGE WITH REPLY
  // ============================================
  const sendMessage = useCallback(() => {
    if (!text.trim() || disabled || sending) return;

    const textarea = textareaRef.current;

    // 🔥 Pass replyTo messageId if exists
    const replyToId = replyingTo?.messageId || null;
    
    console.log("📤 [ChatInput] Sending message with reply:", {
      conversationId,
      replyToId,
      hasReplyData: !!replyingTo
    });

    onSendMessage(text, replyToId);
    
    setText("");

    // 🔥 Clear reply state after sending
    if (replyToId && conversationId) {
      clearReplyingTo(conversationId);
    }

    if (onTypingChange) {
      onTypingChange(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (textarea) {
      requestAnimationFrame(() => {
        textarea.style.height = "auto";
        textarea.focus({ preventScroll: true });
      });
    }
  }, [text, disabled, sending, replyingTo, conversationId, onSendMessage, clearReplyingTo, onTypingChange]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  const handleKeyPress = useCallback((e) => {
    // ESC to cancel reply
    if (e.key === "Escape" && replyingTo) {
      e.preventDefault();
      handleClearReply();
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage, replyingTo, handleClearReply]);

  // ============================================
  // 🔥 TRUNCATE TEXT FOR PREVIEW
  // ============================================
  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // ============================================
  // 🔥 DEBUG: Log replyingTo changes
  // ============================================
  useEffect(() => {
    console.log("📊 [ChatInput] State:", {
      conversationId,
      hasReplyingTo: !!replyingTo,
      replyingToData: replyingTo
    });
  }, [conversationId, replyingTo]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="bg-white border-t border-gray-200 shrink-0">
      {/* Centered Content Wrapper */}
      <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
        
        {/* 🔥 REPLY PREVIEW */}
        {replyingTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 animate-in slide-in-from-bottom-2 duration-200">
            {/* Reply Icon */}
            <svg
              className="h-4 w-4 shrink-0 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>

            {/* Reply Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700">
                {t("input.replyingTo") || "Replying to"} {replyingTo.sender?.nickname || "Unknown"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {truncateText(replyingTo.content, 60)}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClearReply}
              className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              title={t("input.cancelReply") || "Cancel reply"}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Emoji Picker */}
        <div className="relative">
          <EmojiPicker
            show={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onEmojiClick={handleEmojiClick}
            emojiButtonRef={emojiButtonRef}
          />

          {/* Input Shell */}
          <div 
            className={`
              flex items-center gap-2 
              rounded-3xl border-2 bg-white
              px-3 py-2
              transition-all duration-200
              ${disabled || sending
                ? "border-gray-200 opacity-60 cursor-not-allowed"
                : "border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
              }
            `}
          >
            {/* LEFT SLOT - Upload Button */}
            <button
              type="button"
              onClick={handleImageClick}
              disabled={disabled || sending}
              className={`
                flex h-9 w-9 shrink-0 
                items-center justify-center 
                rounded-full
                transition-all duration-200
                ${
                  disabled || sending
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95"
                }
              `}
              title={t("input.uploadImage") || "Upload image"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            {/* CENTER - Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyPress}
              disabled={disabled || sending}
              placeholder={
                placeholder ||
                (disabled 
                  ? t("input.disabled") || "Select a conversation to start chatting"
                  : sending
                  ? t("input.sending") || "Sending..."
                  : replyingTo
                  ? t("input.replyPlaceholder") || "Type your reply..."
                  : t("input.placeholder") || "Type a message...")
              }
              className={`
                flex-1 resize-none bg-transparent
                py-1.75 min-h-9
                text-[15px] leading-5.5
                outline-none placeholder:text-gray-400
                chat-input-textarea
                ${disabled || sending ? "cursor-not-allowed" : ""}
              `}
              style={{
                maxHeight: "180px",
                overflowY: text.split('\n').length > 5 ? 'auto' : 'hidden',
                overflowX: "hidden",
              }}
            />

            {/* RIGHT SLOT - Emoji + Send Buttons */}
            <div className="flex shrink-0 items-center gap-1">
              {/* Emoji Button */}
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={toggleEmojiPicker}
                disabled={disabled || sending}
                className={`
                  flex h-9 w-9 
                  items-center justify-center 
                  rounded-full
                  transition-all duration-200
                  ${
                    disabled || sending
                      ? "text-gray-300 cursor-not-allowed"
                      : showEmojiPicker
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 active:scale-95"
                  }
                `}
                title={t("input.selectEmoji") || "Select emoji"}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={sendMessage}
                disabled={!text.trim() || disabled || sending}
                className={`
                  flex h-9 w-9 
                  items-center justify-center 
                  rounded-full
                  transition-all duration-200
                  ${
                    !text.trim() || disabled || sending
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-800 active:scale-95"
                  }
                `}
                title={sending ? (t("input.sending") || "Sending...") : (t("input.send") || "Send")}
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;