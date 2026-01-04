// frontend/src/hooks/chat/useMarkAsRead.js
import { useCallback, useEffect, useRef } from 'react';
import useChatStore from '../../store/chat/chatStore';
import chatApi from '../../services/chatApi';

/**
 * useMarkAsRead Hook - FIXED WITH SOCKET DELAY
 * 
 * Automatically marks conversation as read when:
 * - User opens conversation
 * - New message arrives in active conversation
 * 
 * 🔥 CRITICAL FIX:
 * - Wait for socket listeners to be ready before marking as read
 * - This ensures we don't miss the read receipt event
 * 
 * Features:
 * - Auto-mark when conversation is opened
 * - Debounce to avoid too many API calls
 * - Only marks if unreadCount > 0
 * - Updates local state immediately (optimistic)
 * - Waits for socket setup before marking
 * 
 * @param {string} conversationId - Active conversation ID
 * @param {boolean} isActive - Whether conversation is currently active/visible
 */
const useMarkAsRead = (conversationId, isActive = true) => {
  const timeoutRef = useRef(null);
  const lastMarkedRef = useRef(null);
  const socketReadyRef = useRef(false);

  const conversations = useChatStore((state) => state.conversations);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);
  const hasJoinedConversation = useChatStore((state) => state.hasJoinedConversation);

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

    // 🔥 CRITICAL: Wait for socket to be ready (joined room + listeners setup)
    const isSocketReady = hasJoinedConversation(conversationId);
    
    if (!isSocketReady) {
      console.log('⏳ [useMarkAsRead] Socket not ready, waiting...', conversationId);
      
      // Retry after 500ms
      setTimeout(() => {
        socketReadyRef.current = true;
        markAsRead();
      }, 500);
      
      return;
    }

    try {
      // Update UI immediately (optimistic)
      resetUnreadCount(conversationId);
      lastMarkedRef.current = conversationId;

      console.log('📖 [useMarkAsRead] Marking as read:', conversationId);

      // Call API
      await chatApi.markConversationAsRead(conversationId);

      console.log('✅ [useMarkAsRead] Marked conversation as read:', conversationId);
    } catch (err) {
      console.error('❌ [useMarkAsRead] Failed to mark as read:', err);
      // Note: We don't revert optimistic update
      // Backend will sync correct state via socket
    }
  }, [conversationId, isActive, conversations, resetUnreadCount, hasJoinedConversation]);

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
    socketReadyRef.current = false;
  }, [conversationId]);

  return {
    markAsRead, // Expose for manual marking
  };
};

export default useMarkAsRead;