// frontend/src/hooks/chat/useTyping.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../../services/socketService';
import useChatStore from '../../store/chat/chatStore';

/**
 * useTyping Hook - Fixed Race Condition
 * 
 * ✅ REMOVED interval → Fixed "typing won't disappear" bug
 * ✅ Uses debounce approach (Messenger/Telegram standard)
 * ✅ No race condition between emit(true) and emit(false)
 * ✅ Production ready
 */

// ✅ Shared empty Set reference
const EMPTY_SET = new Set();

// ⏱️ Typing durations (Messenger/Telegram standard)
const TYPING_STOP_DELAY = 1500; // Stop after 1.5s of no input
const TYPING_DISPLAY_DURATION = 3000; // Display for 3s after last update

const useTyping = (conversationId) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emittedTypingRef = useRef(false);

  // ============================================
  // ✅ STABLE SELECTOR
  // ============================================

  const typingUsersSet = useChatStore((state) => {
    if (!conversationId) return EMPTY_SET;
    return state.typingUsers.get(conversationId) || EMPTY_SET;
  });

  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);

  // Convert Set to Array
  const typingUsers = Array.from(typingUsersSet);

  // ============================================
  // EMIT TYPING STATUS
  // ============================================

  const emitTyping = useCallback(
    (typing) => {
      const socket = getSocket();
      
      if (!socket || !conversationId) {
        console.log(`⌨️ [emitTyping] SKIP: socket=${!!socket}, convId=${!!conversationId}`);
        return;
      }

      // ✅ Don't emit if tab is hidden (save bandwidth)
      if (document.hidden && typing) {
        console.log(`⌨️ [emitTyping] SKIP: tab hidden`);
        return;
      }

      console.log(`🔴 [emitTyping] SENDING: typing=${typing}, convId=${conversationId}, time=${Date.now()}`);

      socket.emit('typing', {
        conversationId,
        isTyping: typing,
      });
      
      emittedTypingRef.current = typing;
    },
    [conversationId]
  );

  // ============================================
  // STOP TYPING (define first to avoid circular deps)
  // ============================================

  const stopTyping = useCallback(() => {
    console.log(`🛑 [stopTyping] Called: convId=${conversationId}, emitted=${emittedTypingRef.current}`);

    if (!conversationId || !emittedTypingRef.current) {
      console.log(`🛑 [stopTyping] SKIP: early return`);
      return;
    }

    console.log(`🛑 [stopTyping] Executing stop...`);

    setIsTyping(false);

    // ✅ Emit stop typing
    emitTyping(false);
    emittedTypingRef.current = false;

    // ✅ Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, emitTyping]);

  // ============================================
  // START TYPING (NO INTERVAL - debounce approach)
  // ============================================

  const startTyping = useCallback(() => {
    console.log(`▶️ [startTyping] Called: convId=${conversationId}, emitted=${emittedTypingRef.current}`);

    if (!conversationId) {
      console.log(`▶️ [startTyping] SKIP: no conversationId`);
      return;
    }

    setIsTyping(true);

    // ✅ Emit typing ONCE per burst (not continuously)
    if (!emittedTypingRef.current) {
      console.log(`▶️ [startTyping] First emit in this burst`);
      emitTyping(true);
      emittedTypingRef.current = true;
    }

    // ✅ Reset stop timer (debounce effect)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      console.log(`▶️ [startTyping] Cleared old timeout`);
    }

    // ✅ Auto-stop after 1.5s of no new typing
    typingTimeoutRef.current = setTimeout(() => {
      console.log(`⏰ [startTyping] Timeout fired after ${TYPING_STOP_DELAY}ms`);
      stopTyping();
    }, TYPING_STOP_DELAY);
  }, [conversationId, emitTyping, stopTyping]);

  // ============================================
  // SOCKET EVENT LISTENERS
  // ============================================

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !conversationId) return;

    // Map to track timeouts for each typing user
    const typingTimeouts = new Map();

    const handleUserTyping = (data) => {
      const { conversationId: typingConvId, user, isTyping: typing } = data;

      console.log(`📥 [handleUserTyping] RAW EVENT:`, {
        typingConvId,
        activeConvId: conversationId,
        userId: user.uid,
        typing,
        timestamp: Date.now()
      });

      if (typingConvId !== conversationId) {
        console.log(`📥 [handleUserTyping] SKIP: different conversation`);
        return;
      }

      // ✅ CRITICAL FIX: Don't add yourself to typing list
      const currentUser = useChatStore.getState().currentUser;
      const currentUserId = currentUser?._id || currentUser?.uid;
      
      console.log(`📥 [handleUserTyping] Checking ownership:`, {
        eventUserId: user.uid,
        currentUserId: currentUserId,
        isOwn: user.uid === currentUserId
      });

      if (user.uid === currentUserId) {
        console.log(`📥 [handleUserTyping] ✅ IGNORED: own typing event`);
        return;
      }

      console.log(`📥 [handleUserTyping] Processing remote user typing=${typing}`);

      if (typing) {
        // ✅ Add user to typing list
        console.log(`📥 [handleUserTyping] Adding user ${user.uid} to typing list`);
        addTypingUser(conversationId, user);

        // ✅ Clear existing timeout for this user
        if (typingTimeouts.has(user.uid)) {
          console.log(`📥 [handleUserTyping] Clearing existing timeout for ${user.uid}`);
          clearTimeout(typingTimeouts.get(user.uid));
        }

        // ✅ Auto-remove after 3 seconds (backup if stop signal lost)
        const timeout = setTimeout(() => {
          console.log(`⏰ [handleUserTyping] Auto-removing ${user.uid} after ${TYPING_DISPLAY_DURATION}ms`);
          removeTypingUser(conversationId, user.uid);
          typingTimeouts.delete(user.uid);
        }, TYPING_DISPLAY_DURATION);

        typingTimeouts.set(user.uid, timeout);
        console.log(`📥 [handleUserTyping] Set ${TYPING_DISPLAY_DURATION}ms timeout for ${user.uid}`);
      } else {
        // ✅ Remove user immediately when they stop typing
        console.log(`📥 [handleUserTyping] Removing user ${user.uid} (stop signal)`);
        removeTypingUser(conversationId, user.uid);
        
        // Clear timeout
        if (typingTimeouts.has(user.uid)) {
          console.log(`📥 [handleUserTyping] Cleared timeout for ${user.uid}`);
          clearTimeout(typingTimeouts.get(user.uid));
          typingTimeouts.delete(user.uid);
        }
      }
    };

    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);
      
      // ✅ Cleanup all timeouts
      typingTimeouts.forEach(timeout => clearTimeout(timeout));
      typingTimeouts.clear();
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