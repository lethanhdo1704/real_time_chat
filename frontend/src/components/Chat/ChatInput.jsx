// frontend/src/components/Chat/ChatInput.jsx
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import EmojiPicker from "./EmojiPicker";

/**
 * ChatInput Component
 * 
 * Auto-resizing textarea with emoji picker
 * Handles typing events for real-time indicators
 * Supports Enter to send, Shift+Enter for new line
 */
export default function ChatInput({ 
  onSendMessage, 
  onTypingChange,
  disabled = false,
  sending = false,
}) {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ============================================
  // EMOJI PICKER
  // ============================================

  const handleEmojiClick = useCallback((emojiObject) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const emoji = emojiObject.emoji;
    const newText = text.substring(0, start) + emoji + text.substring(end);

    setText(newText);

    // Auto resize after emoji insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);

      // Trigger resize
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
    }, 0);

    setShowEmojiPicker(false);
  }, [text]);

  // ============================================
  // TEXT CHANGE WITH TYPING INDICATOR
  // ============================================

  const handleTextChange = useCallback((e) => {
    const value = e.target.value;
    setText(value);

    // Auto resize textarea (ChatGPT style)
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
    }

    // Emit typing started
    if (onTypingChange && value.trim()) {
      onTypingChange(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingChange) {
        onTypingChange(false);
      }
    }, 1000);
  }, [onTypingChange]);

  // ============================================
  // SEND MESSAGE
  // ============================================

  const sendMessage = useCallback(() => {
    if (!text.trim() || disabled || sending) return;

    // Call parent handler
    onSendMessage(text);

    // Clear input
    setText("");

    // Stop typing indicator
    if (onTypingChange) {
      onTypingChange(false);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }

    // Focus back to textarea
    textareaRef.current?.focus();
  }, [text, disabled, sending, onSendMessage, onTypingChange]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="bg-white border-t border-gray-200 p-4 shadow-lg shrink-0">
      <div className="flex items-end gap-3">
        {/* Textarea Container */}
        <div className="flex-1 relative min-w-0">
          {/* Emoji Picker Component */}
          <EmojiPicker
            show={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onEmojiClick={handleEmojiClick}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyPress}
            disabled={disabled || sending}
            placeholder={
              disabled 
                ? t("input.disabled") || "Select a conversation to start chatting"
                : sending
                ? t("input.sending") || "Sending..."
                : t("input.placeholder") || "Type a message..."
            }
            rows="1"
            className={`
              w-full px-4 py-3 pr-12 border rounded-2xl 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none max-h-32 transition-all duration-200
              placeholder:text-gray-400
              ${disabled || sending 
                ? "bg-gray-50 cursor-not-allowed opacity-60" 
                : "bg-white border-gray-300"
              }
            `}
            style={{
              minHeight: "48px",
              maxHeight: "128px",
              overflowX: "hidden",
            }}
          />

          {/* Emoji Button - Positioned absolutely inside textarea */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled || sending}
            className={`
              absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 shrink-0
              ${
                disabled || sending
                  ? "text-gray-300 cursor-not-allowed"
                  : showEmojiPicker
                  ? "text-blue-500 bg-blue-50"
                  : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
              }
            `}
            title={t("input.selectEmoji") || "Select emoji"}
            type="button"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={sendMessage}
          disabled={!text.trim() || disabled || sending}
          className={`
            px-6 py-3 rounded-2xl font-medium shadow-md
            flex items-center gap-2 whitespace-nowrap shrink-0
            transition-all duration-200
            ${
              !text.trim() || disabled || sending
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-linear-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-95"
            }
          `}
        >
          {sending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></div>
              {t("input.sending") || "Sending..."}
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              {t("input.send") || "Send"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}