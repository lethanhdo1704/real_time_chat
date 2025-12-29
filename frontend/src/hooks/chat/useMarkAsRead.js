// frontend/src/hooks/chat/useMarkAsRead.js
import { useCallback, useEffect, useRef } from 'react';
import useChatStore from '../../store/chat/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useMarkAsRead Hook
 * 
 * ✅ FIXED: Use correct API function name
 * 
 * Automatically marks conversation as read when:
 * - User opens conversation
 * - New message arrives in active conversation
 * 
 * Features:
 * - Auto-mark when conversation is opened
 * - Debounce to avoid too many API calls
 * - Only marks if unreadCount > 0
 * - Updates local state immediately (optimistic)
 * 
 * @param {string} conversationId - Active conversation ID
 * @param {boolean} isActive - Whether conversation is currently active/visible
 */
const useMarkAsRead = (conversationId, isActive = true) => {
  const timeoutRef = useRef(null);
  const lastMarkedRef = useRef(null);

  const conversations = useChatStore((state) => state.conversations);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);

  /**
   * Mark conversation as read
   */
  const markAsRead = useCallback(async () => {
    if (!conversationId || !isActive) return;

    // Get conversation
    const conversation = conversations.get(conversationId);
    if (!conversation) return;

    // Only mark if there's unread messages
    if (conversation.unreadCount === 0) return;

    // Avoid duplicate calls
    if (lastMarkedRef.current === conversationId) return;

    try {
      // Update UI immediately (optimistic)
      resetUnreadCount(conversationId);
      lastMarkedRef.current = conversationId;

      // 🔥 FIX: Use correct function name from chatApi
      await chatApi.markConversationAsRead(conversationId);

      console.log('✅ [useMarkAsRead] Marked conversation as read:', conversationId);
    } catch (err) {
      console.error('❌ [useMarkAsRead] Failed to mark as read:', err);
      // Note: We don't revert optimistic update
      // Backend will sync correct state via socket
    }
  }, [conversationId, isActive, conversations, resetUnreadCount]);

  // ============================================
  // AUTO MARK AS READ
  // ============================================

  useEffect(() => {
    if (!conversationId || !isActive) {
      // Clear timeout if conversation becomes inactive
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Debounce: Mark as read after 1 second of viewing
    timeoutRef.current = setTimeout(() => {
      markAsRead();
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [conversationId, isActive, markAsRead]);

  // ============================================
  // RESET LAST MARKED ON CONVERSATION CHANGE
  // ============================================

  useEffect(() => {
    lastMarkedRef.current = null;
  }, [conversationId]);

  return {
    markAsRead, // Expose for manual marking
  };
};

export default useMarkAsRead;