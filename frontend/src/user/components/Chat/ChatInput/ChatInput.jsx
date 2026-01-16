// frontend/src/components/Chat/ChatInput/ChatInput.jsx - FINAL FIXED VERSION

import { forwardRef, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../context/AuthContext";
import useChatStore from "../../../store/chat/chatStore";
import useGroupPermissions from "../../../hooks/chat/useGroupPermissions";

import useChatInput from "./useChatInput";
import useReply from "./useReply";
import useTyping from "./UseTyping";
import useEmojiInput from "./UseEmojiInput";
import { useFileUpload } from "../../../hooks/chat/useFileUpload";
import { extractLinkAttachments } from "../../../utils/linkUtils";

import BlockedBanner from "./BlockedBanner";
import PermissionBanner from "./PermissionBanner";
import ReplyPreview from "./ReplyPreview";
import UploadProgress from "../FileUpload/UploadProgress";
import FilePreview from "../FileUpload/FilePreview";
import InputArea from "./InputArea";

/**
 * ChatInput Component - FINAL FIXED VERSION
 * 
 * ✅ Fixed: Check memberStatus BEFORE canSendMessage
 * ✅ Fixed: Proper kicked/left banner display
 * ✅ Fixed: Permission banner for admins_only groups
 * ✅ Fixed: Support new private chat (conversationId = null is NORMAL)
 * ✅ Fixed: Removed unnecessary "no conversation selected" check
 */
const ChatInput = forwardRef(({ 
  onSendMessage, 
  onTypingChange,
  disabled = false,
  sending = false,
  placeholder,
}, ref) => {
  const { t } = useTranslation("chat");
  const { token, user } = useContext(AuthContext);

  // Get conversation and check permissions
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const conversation = conversations.get(activeConversationId);

  // 🔥 conversationId can be null for new private chat - THIS IS NORMAL!
  const permissions = useGroupPermissions(activeConversationId, user?.uid);
  
  // 🔍 DEBUG: Log permissions with all fields
  console.log('🔐 [ChatInput] Full Debug:', {
    activeConversationId,
    hasConversation: !!conversation,
    conversationType: conversation?.type,
    userUid: user?.uid,
    permissions: {
      ...permissions,
    },
  });
  
  const {
    canSendMessage,
    isGroup,
    memberStatus,
    kickedBy,
    kickedAt,
    myRole,
  } = permissions;

  // ============================================
  // 🔥 CRITICAL: CALL ALL HOOKS FIRST
  // ============================================
  // File upload hook - MUST call before any returns
  const {
    uploading,
    uploadProgress,
    uploadSpeed,
    uploadError: rawUploadError,
    selectedFiles,
    selectFiles,
    uploadFiles,
    cancelUpload,
    clearFiles,
    removeFile,
  } = useFileUpload();

  // Translate upload error
  const uploadError = useMemo(() => {
    if (!rawUploadError) return null;
    
    const errorMsg = typeof rawUploadError === 'string' 
      ? rawUploadError 
      : rawUploadError.message || rawUploadError.toString();
    
    const errorPatterns = [
      { pattern: /exceeds maximum size of (\d+)GB/i, key: 'uploadService.fileExceedsMaxSize', extract: true },
      { pattern: /Maximum (\d+) files per batch/i, key: 'uploadService.maxFilesPerBatch', extract: true },
      { pattern: /Batch total size.*exceeds/i, key: 'uploadService.batchSizeExceeds' },
      { pattern: /Invalid file/i, key: 'uploadService.invalidFile' },
      { pattern: /No files selected/i, key: 'uploadService.noFilesSelected' },
      { pattern: /Upload cancelled/i, key: 'uploadService.uploadCancelled' },
      { pattern: /network error/i, key: 'uploadService.uploadFailedNetwork' },
      { pattern: /Failed to generate upload URL/i, key: 'uploadService.failedToGenerateUrl' },
      { pattern: /Failed to generate upload URLs/i, key: 'uploadService.failedToGenerateUrls' },
      { pattern: /Failed to get upload limits/i, key: 'uploadService.failedToGetLimits' },
      { pattern: /Upload failed with status (\d+)/i, key: 'uploadService.uploadFailedStatus', extract: true },
      { pattern: /Failed to cancel upload/i, key: 'uploadService.failedToCancelUpload' },
      { pattern: /Failed to delete file/i, key: 'uploadService.failedToDeleteFile' },
      { pattern: /Failed to delete files/i, key: 'uploadService.failedToDeleteFiles' },
      { pattern: /File #(\d+):/i, key: 'uploadService.fileError', extract: true },
    ];
    
    for (const { pattern, key, extract } of errorPatterns) {
      const match = errorMsg.match(pattern);
      if (match) {
        if (extract && match[1]) {
          return t(key, { value: match[1] });
        }
        return t(key);
      }
    }
    
    return errorMsg;
  }, [rawUploadError, t]);

  // Compute final disabled state
  const isInputDisabled = disabled || sending || uploading || !canSendMessage;

  // ============================================
  // SEND HANDLER - WITH LINK EXTRACTION
  // ============================================
  const handleSend = async () => {
    console.log('📤 [ChatInput] Send clicked:', {
      text: text.trim().length,
      files: selectedFiles.length,
      hasConversationId: !!activeConversationId,
    });

    if (uploading) {
      console.warn('⚠️ Upload in progress');
      return;
    }

    if (!canSendMessage) {
      console.warn('⚠️ No permission to send');
      return;
    }

    const trimmedText = text.trim();
    const hasContent = trimmedText.length > 0;
    const hasFiles = selectedFiles.length > 0;

    if (!hasContent && !hasFiles) {
      console.warn('⚠️ No content to send');
      return;
    }

    try {
      let attachments = [];

      // 1️⃣ Upload files first
      if (hasFiles) {
        console.log('📤 [ChatInput] Uploading files...');
        const fileAttachments = await uploadFiles(selectedFiles, token);
        console.log('✅ [ChatInput] Files uploaded:', {
          count: fileAttachments.length,
          types: fileAttachments.map(f => f.mediaType),
        });
        attachments = [...fileAttachments];
      }

      // 2️⃣ Extract links from text
      if (hasContent) {
        const linkAttachments = extractLinkAttachments(trimmedText);
        
        if (linkAttachments.length > 0) {
          console.log('🔗 [ChatInput] Links extracted:', {
            count: linkAttachments.length,
            urls: linkAttachments.map(l => l.url),
          });
          attachments = [...attachments, ...linkAttachments];
        }
      }

      // 3️⃣ Send message with all attachments
      console.log('📤 [ChatInput] Sending message:', {
        hasText: hasContent,
        textLength: trimmedText.length,
        fileCount: hasFiles ? selectedFiles.length : 0,
        linkCount: attachments.filter(a => a.mediaType === 'link').length,
        totalAttachments: attachments.length,
      });

      await sendTextMessage(trimmedText, replyingTo?.messageId || null, attachments);
      
      console.log('✅ [ChatInput] Message sent successfully');

      // 4️⃣ Clear files after successful send
      clearFiles();
      
    } catch (error) {
      console.error('❌ [ChatInput] Send error:', error);
      // Don't clear files on error - let user retry
    }
  };

  // ============================================
  // HOOKS
  // ============================================
  const {
    text,
    setText,
    textareaRef,
    handleTextChange,
    handleKeyPress,
    sendMessage: sendTextMessage,
  } = useChatInput({
    onSendMessage,
    disabled: isInputDisabled,
    sending,
    ref,
    onSend: handleSend,
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
  // FILE HANDLERS
  // ============================================
  
  const handleFilesSelect = async (files) => {
    console.log('📁 [ChatInput] Files selected:', {
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

  const handlePaste = async (e) => {
    if (isInputDisabled) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    const files = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
          console.log('📋 [ChatInput] File pasted:', {
            name: file.name,
            type: file.type,
            size: file.size,
          });
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await handleFilesSelect(files);
    }
  };

  // ============================================
  // COMPUTE PLACEHOLDER
  // ============================================
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    if (isInputDisabled) {
      return t("input.disabled");
    }
    
    if (sending || uploading) {
      return t("input.sending");
    }
    
    return t("input.placeholder");
  };

  // ============================================
  // 🔥 CONDITIONAL RENDERING - AFTER ALL HOOKS
  // ============================================
  
  // Check 1: Conversation not found ERROR (has conversationId but no data in store)
  if (activeConversationId && memberStatus === 'conversation_not_found') {
    console.log('❌ [ChatInput] Conversation not found in store');
    
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-4 text-center">
        <p className="text-sm text-red-500">
          {t("input.conversationNotFound") || "Conversation not found"}
        </p>
      </div>
    );
  }

  // Check 2: Kicked or Left
  if (memberStatus === 'kicked' || memberStatus === 'left') {
    console.log('🚫 [ChatInput] Showing BlockedBanner:', {
      memberStatus,
      kickedBy,
      kickedAt,
    });

    return (
      <BlockedBanner
        memberStatus={memberStatus}
        kickedBy={kickedBy}
        kickedAt={kickedAt}
        t={t}
      />
    );
  }

  // Check 3: Blocked (private chat)
  if (memberStatus === 'blocked') {
    console.log('🚫 [ChatInput] Showing PermissionBanner (blocked)');

    return (
      <PermissionBanner 
        t={t}
        reason="blocked"
      />
    );
  }

  // Check 4: Permission Banner (admins_only in group)
  if (!canSendMessage && isGroup) {
    console.log('⚠️ [ChatInput] Showing PermissionBanner (admins_only):', {
      canSendMessage,
      isGroup,
      memberStatus,
      myRole,
      messagePermission: conversation?.messagePermission,
    });

    return (
      <PermissionBanner 
        t={t}
        reason="admins_only"
      />
    );
  }

  // Check 5: Other cases where canSendMessage is false
  if (!canSendMessage) {
    console.log('⚠️ [ChatInput] Showing PermissionBanner (no_permission)');

    return (
      <PermissionBanner 
        t={t}
        reason="no_permission"
      />
    );
  }

  // ============================================
  // RENDER: NORMAL INPUT
  // ✅ This includes new private chat where conversationId = null
  // ============================================
  return (
    <div className="bg-white border-t border-gray-200 shrink-0">
      <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
        
        {/* Reply Preview */}
        {replyingTo && (
          <ReplyPreview
            replyingTo={replyingTo}
            onClear={handleClearReply}
            truncateText={truncateText}
            t={t}
          />
        )}

        {/* Upload Progress */}
        {uploading && (
          <UploadProgress
            progress={uploadProgress}
            speed={uploadSpeed}
            filesCount={selectedFiles.length}
            onCancel={cancelUpload}
          />
        )}

        {/* File Preview */}
        {selectedFiles.length > 0 && !uploading && (
          <div className="mb-2">
            <FilePreview
              files={selectedFiles}
              onRemove={removeFile}
              onClear={clearFiles}
            />
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
            {uploadError}
          </div>
        )}

        {/* Input Area */}
        <InputArea
          text={text}
          textareaRef={textareaRef}
          handleTextChange={handleTextChange}
          handleKeyPress={handleKeyPress}
          handlePaste={handlePaste}
          handleSend={handleSend}
          handleFilesSelect={handleFilesSelect}
          isInputDisabled={isInputDisabled}
          placeholder={getPlaceholder()}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          toggleEmojiPicker={toggleEmojiPicker}
          handleEmojiClick={handleEmojiClick}
          emojiButtonRef={emojiButtonRef}
          selectedFiles={selectedFiles}
          sending={sending}
          uploading={uploading}
          t={t}
        />
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;