// frontend/src/user/components/Chat/ChatInput/useChatInput.js

import { useState, useRef, useCallback, useEffect, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import useChatStore from "../../../store/chat/chatStore";

/**
 * useChatInput Hook - WITH ATTACHMENTS SUPPORT
 * 
 * Handles main input logic, text state, sending messages with attachments
 * 
 * @param {Object} props
 * @param {Function} props.onSendMessage - Callback when message is sent
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.sending - Whether message is being sent
 * @param {Function} props.onSend - Optional unified send handler (for files + text)
 * @param {React.Ref} props.ref - Forwarded ref for imperative methods
 */
const useChatInput = ({ onSendMessage, disabled, sending, onSend, ref }) => {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

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
  // 🔥 SEND MESSAGE WITH REPLY + ATTACHMENTS
  // ============================================
  const sendMessage = useCallback(async (messageText, replyToId = null, attachments = []) => {
    // Allow empty text if has attachments
    if (!messageText.trim() && attachments.length === 0) return;
    if (disabled || sending) return;

    const textarea = textareaRef.current;

    console.log("📤 [useChatInput] Sending message:", {
      conversationId,
      replyToId: replyToId || replyingTo?.messageId,
      hasAttachments: attachments.length > 0,
      attachmentsCount: attachments.length,
    });

    // Use provided replyToId or get from state
    const finalReplyToId = replyToId || replyingTo?.messageId || null;

    // Call parent's onSendMessage with attachments
    await onSendMessage(messageText, finalReplyToId, attachments);
    
    setText("");

    // Clear reply state after sending
    if (finalReplyToId && conversationId) {
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
  // 🔥 KEYBOARD SHORTCUTS - SUPPORT UNIFIED HANDLER
  // ============================================
  const handleKeyPress = useCallback((e) => {
    // ESC to cancel reply (handled in useReply hook)
    if (e.key === "Escape" && replyingTo) {
      return;
    }

    // Enter without Shift = Send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      if (disabled || sending) {
        console.log('[useChatInput] Cannot send: disabled or sending');
        return;
      }

      const trimmedText = text.trim();

      console.log('[useChatInput] Enter pressed, sending...');
      
      // 🔥 Use unified handler if provided (includes file support)
      if (onSend) {
        onSend();
      } else {
        // Legacy: send text only if there's text
        if (trimmedText) {
          sendMessage(trimmedText);
        }
      }
    }
  }, [text, disabled, sending, replyingTo, sendMessage, onSend]);

  return {
    text,
    setText,
    textareaRef,
    handleTextChange,
    handleKeyPress,
    sendMessage,
  };
};

export default useChatInput;