import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import EmojiPicker from "./EmojiPicker";
import useChatInput from "./useChatInput";
import useReply from "./useReply";
import useTyping from "./useTyping";
import useEmojiInput from "./useEmojiInput";

/**
 * ChatInput Component - With Reply Feature
 * 
 * ✅ Reply preview UI
 * ✅ Clear reply button
 * ✅ Focus input after setting reply
 * ✅ Pass replyTo to sendMessage
 * ✅ FIXED: Use activeConversationId (string) from store
 * ✅ Refactored: Separated logic into custom hooks
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

  // ============================================
  // CUSTOM HOOKS
  // ============================================
  const {
    text,
    setText,
    textareaRef,
    fileInputRef,
    handleTextChange,
    handleKeyPress,
    handleImageClick,
    handleImageChange,
    sendMessage,
  } = useChatInput({
    onSendMessage,
    onImageSelect,
    disabled,
    sending,
    ref,
  });

  const {
    replyingTo,
    conversationId,
    handleClearReply,
    truncateText,
  } = useReply({
    textareaRef,
  });

  useTyping({
    text,
    onTypingChange,
    textareaRef,
  });

  const {
    showEmojiPicker,
    emojiButtonRef,
    handleEmojiClick,
    toggleEmojiPicker,
    setShowEmojiPicker,
  } = useEmojiInput({
    setText,
    textareaRef,
  });

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