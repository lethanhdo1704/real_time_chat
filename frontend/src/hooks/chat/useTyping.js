// frontend/src/hooks/chat/useTyping.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../../services/socketService';
import useChatStore from '../../store/chatStore';

/**
 * useTyping Hook
 * 
 * Manages typing indicators:
 * - Emits typing status when user types (via socket.emit('typing'))
 * - Debounces to avoid too many emissions
 * - Auto-stops typing after 3 seconds
 * - Listens to others' typing status (via socket.on('user_typing'))
 */
const useTyping = (conversationId) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emittedTypingRef = useRef(false);

  // Get typing users from store
  const typingUsersSet = useChatStore((state) => {
    return state.typingUsers.get(conversationId) || new Set();
  });

  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);

  const typingUsers = Array.from(typingUsersSet);

  // ============================================
  // EMIT TYPING STATUS
  // ============================================

  const emitTyping = useCallback(
    (typing) => {
      const socket = getSocket();
      
      if (!socket || !conversationId) return;

      // ✅ Emit với event 'typing' (backend listen)
      socket.emit('typing', {
        conversationId,
        isTyping: typing,
      });
      
      emittedTypingRef.current = typing;
      console.log(`⌨️ Emitted typing: ${typing}`);
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

    // ✅ Listen to 'user_typing' (backend emit)
    const handleUserTyping = (data) => {
      const { conversationId: typingConvId, user, isTyping: typing } = data;

      if (typingConvId !== conversationId) return;

      console.log(`⌨️ User ${user.uid} typing: ${typing}`);

      if (typing) {
        addTypingUser(conversationId, user.uid);

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
  }, [isTyping, stopTyping]);

  // ============================================
  // RESET ON CONVERSATION CHANGE
  // ============================================

  useEffect(() => {
    if (isTyping) {
      stopTyping();
    }
    emittedTypingRef.current = false;
  }, [conversationId, stopTyping]);

  return {
    isTyping,
    startTyping,
    stopTyping,
    typingUsers,
  };
};

export default useTyping;