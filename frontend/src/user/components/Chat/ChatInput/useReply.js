import { useCallback, useEffect } from "react";
import useChatStore from "../../store/chat/chatStore";

/**
 * useReply Hook
 * Manages reply state, auto-focus on reply, and reply clearing
 */
const useReply = ({ textareaRef }) => {
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
  // 🔥 AUTO FOCUS WHEN REPLY IS SET
  // ============================================
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [replyingTo, textareaRef]);

  // ============================================
  // 🔥 CLEAR REPLY
  // ============================================
  const handleClearReply = useCallback(() => {
    if (conversationId) {
      console.log("🧹 [useReply] Clearing reply for:", conversationId);
      clearReplyingTo(conversationId);
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [conversationId, clearReplyingTo, textareaRef]);

  // ============================================
  // 🔥 TRUNCATE TEXT FOR PREVIEW
  // ============================================
  const truncateText = useCallback((text, maxLength = 50) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }, []);

  // ============================================
  // 🔥 DEBUG: Log replyingTo changes
  // ============================================
  useEffect(() => {
    console.log("📊 [useReply] State:", {
      conversationId,
      hasReplyingTo: !!replyingTo,
      replyingToData: replyingTo
    });
  }, [conversationId, replyingTo]);

  return {
    replyingTo,
    conversationId,
    handleClearReply,
    truncateText,
  };
};

export default useReply;