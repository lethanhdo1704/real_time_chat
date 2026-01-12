// frontend/src/user/components/Chat/ChatInput/ChatInput.jsx

import { forwardRef, useContext } from "react";
import { useTranslation } from "react-i18next";
import EmojiPicker from "../EmojiPicker";
import useChatInput from "./useChatInput";
import useReply from "./useReply";
import useTyping from "./UseTyping";
import useEmojiInput from "./UseEmojiInput";
import { useFileUpload } from "../../../hooks/chat/useFileUpload";
import { AuthContext } from "../../../context/AuthContext";
import FilePreview from "../FileUpload/FilePreview";
import UploadProgress from "../FileUpload/UploadProgress";
import FileUploadButton from "../FileUpload/FileUploadButton"; // 🔥 NEW IMPORT

const ChatInput = forwardRef(({ 
  onSendMessage, 
  onTypingChange,
  disabled = false,
  sending = false,
  placeholder,
}, ref) => {
  const { t } = useTranslation("chat");
  const { token } = useContext(AuthContext);

  console.log('🔍 [ChatInput] Render:', {
    hasToken: !!token,
    disabled,
    sending,
  });

  // File upload hook
  const {
    uploading,
    uploadProgress,
    uploadSpeed,
    uploadError,
    selectedFiles,
    selectFiles,
    uploadFiles,
    cancelUpload,
    clearFiles,
    removeFile,
  } = useFileUpload();

  // Existing hooks
  const {
    text,
    setText,
    textareaRef,
    handleTextChange,
    handleKeyPress,
    sendMessage: sendTextMessage,
  } = useChatInput({
    onSendMessage,
    disabled,
    sending,
    ref,
  });

  const {
    replyingTo,
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
  // 🔥 FILE UPLOAD HANDLERS
  // ============================================
  
  /**
   * Handle files selected from FileUploadButton
   */
  const handleFilesSelect = async (files) => {
    console.log('📁 [ChatInput] Files selected from button:', {
      count: files.length,
      files: files.map(f => ({ name: f.name, size: f.size })),
    });

    if (!token) {
      console.error('❌ [ChatInput] No token!');
      return;
    }

    try {
      console.log('📁 [ChatInput] Calling selectFiles...');
      const success = await selectFiles(files, token);
      console.log('✅ [ChatInput] selectFiles result:', success);
      
      if (!success) {
        console.error('❌ [ChatInput] selectFiles returned false');
      }
    } catch (error) {
      console.error('❌ [ChatInput] selectFiles error:', error);
    }
  };

  /**
   * Handle send message with files
   */
  const handleSend = async () => {
    console.log('📤 [ChatInput] Send clicked:', {
      text: text.trim().length,
      files: selectedFiles.length,
    });

    if (uploading) {
      console.warn('⚠️ Upload in progress');
      return;
    }

    const hasContent = text.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if (!hasContent && !hasFiles) {
      console.warn('⚠️ No content to send');
      return;
    }

    try {
      let attachments = [];

      if (hasFiles) {
        console.log('📤 Uploading files...');
        attachments = await uploadFiles(selectedFiles, token);
        console.log('✅ Files uploaded:', attachments);
      }

      console.log('📤 Sending message...');
      await sendTextMessage(text, replyingTo?.messageId || null, attachments);
      console.log('✅ Message sent');

      clearFiles();
      
    } catch (error) {
      console.error('❌ Send error:', error);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="bg-white border-t border-gray-200 shrink-0">
      <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
        
        {/* REPLY PREVIEW */}
        {replyingTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 animate-in slide-in-from-bottom-2 duration-200">
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

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700">
                {t("input.replyingTo") || "Replying to"} {replyingTo.sender?.nickname || "Unknown"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {truncateText(replyingTo.content, 60)}
              </p>
            </div>

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

        {/* UPLOAD PROGRESS */}
        {uploading && (
          <UploadProgress
            progress={uploadProgress}
            speed={uploadSpeed}
            filesCount={selectedFiles.length}
            onCancel={cancelUpload}
          />
        )}

        {/* FILE PREVIEW */}
        {selectedFiles.length > 0 && !uploading && (
          <div className="mb-2">
            <FilePreview
              files={selectedFiles}
              onRemove={removeFile}
              onClear={clearFiles}
            />
          </div>
        )}

        {/* UPLOAD ERROR */}
        {uploadError && (
          <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
            {uploadError}
          </div>
        )}

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
              ${disabled || sending || uploading
                ? "border-gray-200 opacity-60 cursor-not-allowed"
                : "border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
              }
            `}
          >
            {/* 🔥 LEFT SLOT - FileUploadButton Component */}
            <FileUploadButton
              onFilesSelect={handleFilesSelect}
              disabled={disabled || sending || uploading}
            />

            {/* CENTER - Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyPress}
              disabled={disabled || sending || uploading}
              placeholder={
                placeholder ||
                (disabled 
                  ? t("input.disabled") || "Select a conversation to start chatting"
                  : sending || uploading
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
                ${disabled || sending || uploading ? "cursor-not-allowed" : ""}
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
                disabled={disabled || sending || uploading}
                className={`
                  flex h-9 w-9 
                  items-center justify-center 
                  rounded-full
                  transition-all duration-200
                  ${
                    disabled || sending || uploading
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
                onClick={handleSend}
                disabled={(!text.trim() && selectedFiles.length === 0) || disabled || sending || uploading}
                className={`
                  flex h-9 w-9 
                  items-center justify-center 
                  rounded-full
                  transition-all duration-200
                  ${
                    (!text.trim() && selectedFiles.length === 0) || disabled || sending || uploading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-800 active:scale-95"
                  }
                `}
                title={sending || uploading ? (t("input.sending") || "Sending...") : (t("input.send") || "Send")}
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
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;