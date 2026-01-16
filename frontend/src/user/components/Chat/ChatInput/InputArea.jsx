// frontend/src/components/Chat/ChatInput/InputArea.jsx
import React from 'react';
import EmojiPicker from '../EmojiPicker';
import FileUploadButton from '../FileUpload/FileUploadButton';

export default function InputArea({
  text,
  textareaRef,
  handleTextChange,
  handleKeyPress,
  handlePaste,
  handleSend,
  handleFilesSelect,
  isInputDisabled,
  placeholder,
  showEmojiPicker,
  setShowEmojiPicker,
  toggleEmojiPicker,
  handleEmojiClick,
  emojiButtonRef,
  selectedFiles,
  sending,
  uploading,
  t,
}) {
  return (
    <div className="relative">
      {/* Emoji Picker */}
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
          ${isInputDisabled
            ? "border-gray-200 opacity-60 cursor-not-allowed"
            : "border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
          }
        `}
      >
        {/* File Upload Button */}
        <FileUploadButton
          onFilesSelect={handleFilesSelect}
          disabled={isInputDisabled}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          onPaste={handlePaste}
          disabled={isInputDisabled}
          placeholder={placeholder}
          className={`
            flex-1 resize-none bg-transparent
            py-1.75 min-h-9
            text-[15px] leading-5.5
            outline-none placeholder:text-gray-400
            chat-input-textarea
            ${isInputDisabled ? "cursor-not-allowed" : ""}
          `}
          style={{
            maxHeight: "180px",
            overflowY: text.split('\n').length > 5 ? 'auto' : 'hidden',
            overflowX: "hidden",
          }}
        />

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Emoji Button */}
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={toggleEmojiPicker}
            disabled={isInputDisabled}
            className={`
              flex h-9 w-9 
              items-center justify-center 
              rounded-full
              transition-all duration-200
              cursor-pointer
              ${
                isInputDisabled
                  ? "text-gray-300 cursor-not-allowed"
                  : showEmojiPicker
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 active:scale-95"
              }
            `}
            title={t("input.selectEmoji")}
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
            onClick={handleSend}
            disabled={(!text.trim() && selectedFiles.length === 0) || isInputDisabled}
            className={`
              flex h-9 w-9 
              items-center justify-center 
              rounded-full
              transition-all duration-200
              ${
                (!text.trim() && selectedFiles.length === 0) || isInputDisabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }
            `}
            title={sending || uploading ? t("input.sending") : t("input.send")}
          >
            {sending || uploading ? (
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
  );
}