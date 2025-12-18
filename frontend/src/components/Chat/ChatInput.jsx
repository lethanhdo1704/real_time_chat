// components/chat/ChatInput.jsx
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import EmojiPicker from "../EmojiPicker";

export default function ChatInput({ onSendMessage, onTypingChange }) {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleEmojiClick = (emojiObject) => {
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
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    // Auto resize textarea (ChatGPT style)
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
    }

    onTypingChange(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange(false);
    }, 1000);
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    onSendMessage(text);
    setText("");
    onTypingChange(false);

    // Reset height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 shadow-lg shrink-0">
      <div className="flex items-end gap-3">
        {/* Textarea with Emoji Button Inside */}
        <div className="flex-1 relative min-w-0">
          {/* Emoji Picker Component */}
          <EmojiPicker
            show={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onEmojiClick={handleEmojiClick}
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyPress}
            placeholder={t("input.placeholder")}
            rows="1"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none max-h-32 transition-all duration-200
              placeholder:text-gray-400"
            style={{
              minHeight: "48px",
              maxHeight: "128px",
              overflowX: "hidden",
            }}
          />

          {/* Emoji Button - Positioned absolutely inside textarea */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 shrink-0 ${
              showEmojiPicker
                ? "text-blue-500 bg-blue-50"
                : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
            }`}
            title={t("input.selectEmoji")}
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
          disabled={!text.trim()}
          className="px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 
            text-white rounded-2xl font-medium shadow-md
            hover:from-blue-600 hover:to-blue-700 hover:shadow-lg
            active:scale-95 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            flex items-center gap-2 whitespace-nowrap shrink-0"
        >
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
          {t("input.send")}
        </button>
      </div>
    </div>
  );
}