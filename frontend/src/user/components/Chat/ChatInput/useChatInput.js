import { useState, useRef, useCallback, useEffect, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import useChatStore from "../../store/chat/chatStore";

/**
 * useChatInput Hook
 * Handles main input logic, text state, sending messages, and keyboard shortcuts
 */
const useChatInput = ({ onSendMessage, onImageSelect, disabled, sending, ref }) => {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get reply state
  const conversationId = useChatStore((state) => state.activeConversationId);
  const clearReplyingTo = useChatStore((state) => state.clearReplyingTo);
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
  // TEXT CHANGE WITH AUTO-RESIZE
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
  }, []);

  // ============================================
  // 🔥 SEND MESSAGE WITH REPLY
  // ============================================
  const sendMessage = useCallback(() => {
    if (!text.trim() || disabled || sending) return;

    const textarea = textareaRef.current;

    // 🔥 Pass replyTo messageId if exists
    const replyToId = replyingTo?.messageId || null;
    
    console.log("📤 [useChatInput] Sending message with reply:", {
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

    if (textarea) {
      requestAnimationFrame(() => {
        textarea.style.height = "auto";
        textarea.focus({ preventScroll: true });
      });
    }
  }, [text, disabled, sending, replyingTo, conversationId, onSendMessage, clearReplyingTo]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  const handleKeyPress = useCallback((e) => {
    // ESC to cancel reply (handled in useReply hook)
    if (e.key === "Escape" && replyingTo) {
      // Will be handled by useReply hook
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage, replyingTo]);

  return {
    text,
    setText,
    textareaRef,
    fileInputRef,
    handleTextChange,
    handleKeyPress,
    handleImageClick,
    handleImageChange,
    sendMessage,
  };
};

export default useChatInput;