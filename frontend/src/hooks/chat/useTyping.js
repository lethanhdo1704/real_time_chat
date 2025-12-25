// frontend/src/hooks/chat/useTyping.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import useChatStore from '../../store/chatStore';

/**
 * useTyping Hook
 * 
 * Manages typing indicators:
 * - Emits typing status when user types
 * - Debounces to avoid too many emissions
 * - Auto-stops typing after 3 seconds
 * - Listens to others' typing status
 * 
 * Usage:
 * const { isTyping, startTyping, stopTyping, typingUsers } = useTyping(conversationId);
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Object} { isTyping, startTyping, stopTyping, typingUsers }
 */
const useTyping = (conversationId) => {
  const { socket, isConnected } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emittedTypingRef = useRef(false);

  // Get typing users from store
  const typingUsersSet = useChatStore((state) => {
    return state.typingUsers.get(conversationId) || new Set();
  });

  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);

  // Convert Set to Array for easier usage
  const typingUsers = Array.from(typingUsersSet);

  // ============================================
  // EMIT TYPING STATUS
  // ============================================

  const emitTyping = useCallback(
    (typing) => {
      if (!socket || !isConnected || !conversationId) return;

      socket.emitTyping(conversationId, typing);
      emittedTypingRef.current = typing;

      console.log(`⌨️ Emitted typing: ${typing}`);
    },
    [socket, isConnected, conversationId]
  );

  // ============================================
  // START TYPING
  // ============================================

  const startTyping = useCallback(() => {
    if (!conversationId) return;

    // Set local typing state
    setIsTyping(true);

    // Emit only once
    if (!emittedTypingRef.current) {
      emitTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [conversationId, emitTyping]);

  // ============================================
  // STOP TYPING
  // ============================================

  const stopTyping = useCallback(() => {
    if (!conversationId) return;

    // Set local typing state
    setIsTyping(false);

    // Emit stop
    if (emittedTypingRef.current) {
      emitTyping(false);
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, emitTyping]);

  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================

  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    // Handler: User is typing
    const handleUserTyping = (data) => {
      const { conversationId: typingConvId, user, isTyping: typing } = data;

      // Only handle for current conversation
      if (typingConvId !== conversationId) return;

      console.log(`⌨️ User ${user.uid} typing: ${typing}`);

      if (typing) {
        addTypingUser(conversationId, user.uid);

        // Auto-remove after 5 seconds (in case stop event is lost)
        setTimeout(() => {
          removeTypingUser(conversationId, user.uid);
        }, 5000);
      } else {
        removeTypingUser(conversationId, user.uid);
      }
    };

    // Subscribe
    socket.on('user_typing', handleUserTyping);

    // Cleanup
    return () => {
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, isConnected, conversationId, addTypingUser, removeTypingUser]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================

  useEffect(() => {
    return () => {
      // Stop typing when component unmounts
      if (isTyping) {
        stopTyping();
      }

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, stopTyping]);

  // ============================================
  // RESET ON CONVERSATION CHANGE
  // ============================================

  useEffect(() => {
    // Stop typing when switching conversations
    if (isTyping) {
      stopTyping();
    }
    emittedTypingRef.current = false;
  }, [conversationId, stopTyping]);

  // ============================================
  // RETURN
  // ============================================

  return {
    isTyping,
    startTyping,
    stopTyping,
    typingUsers, // Array of user IDs who are typing
  };
};

export default useTyping;