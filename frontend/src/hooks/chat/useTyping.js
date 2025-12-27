// frontend/src/hooks/chat/useTyping.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../../services/socketService';
import useChatStore from '../../store/chatStore';

/**
 * useTyping Hook
 * 
 * ✅ FIXED: Stable selectors to prevent infinite loop
 * - Use shared empty Set reference
 * - Convert Set to Array safely
 */

// ✅ Shared empty Set reference (prevent new Set() on every render)
const EMPTY_SET = new Set();

const useTyping = (conversationId) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emittedTypingRef = useRef(false);

  // ============================================
  // ✅ STABLE SELECTOR (use shared EMPTY_SET)
  // ============================================

  const typingUsersSet = useChatStore((state) => {
    if (!conversationId) return EMPTY_SET;
    return state.typingUsers.get(conversationId) || EMPTY_SET;
  });

  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);

  // Convert Set to Array (safe, done in render)
  const typingUsers = Array.from(typingUsersSet);

  // ============================================
  // EMIT TYPING STATUS
  // ============================================

  const emitTyping = useCallback(
    (typing) => {
      const socket = getSocket();
      
      if (!socket || !conversationId) return;

      socket.emit('typing', {
        conversationId,
        isTyping: typing,
      });
      
      emittedTypingRef.current = typing;
      console.log(`⌨️ [useTyping] Emitted typing: ${typing}`);
    },
    [conversationId]
  );

  // ============================================
  // START/STOP TYPING
  // ============================================

  const startTyping = useCallback(() => {
    if (!conversationId) return;

    setIsTyping(true);

    if (!emittedTypingRef.current) {
      emitTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [conversationId, emitTyping]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;

    setIsTyping(false);

    if (emittedTypingRef.current) {
      emitTyping(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, emitTyping]);

  // ============================================
  // SOCKET EVENT LISTENERS
  // ============================================

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !conversationId) return;

    const handleUserTyping = (data) => {
      const { conversationId: typingConvId, user, isTyping: typing } = data;

      if (typingConvId !== conversationId) return;

      console.log(`⌨️ [useTyping] User ${user.uid} typing: ${typing}`);

      if (typing) {
        addTypingUser(conversationId, user.uid);

        // Auto-remove after 5 seconds
        setTimeout(() => {
          removeTypingUser(conversationId, user.uid);
        }, 5000);
      } else {
        removeTypingUser(conversationId, user.uid);
      }
    };

    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);
    };
  }, [conversationId, addTypingUser, removeTypingUser]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================

  useEffect(() => {
    return () => {
      if (isTyping) {
        stopTyping();
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on unmount

  // ============================================
  // RESET ON CONVERSATION CHANGE
  // ============================================

  useEffect(() => {
    // Stop typing when switching conversations
    if (isTyping) {
      stopTyping();
    }
    emittedTypingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // Only when conversationId changes

  return {
    isTyping,
    startTyping,
    stopTyping,
    typingUsers,
  };
};

export default useTyping;