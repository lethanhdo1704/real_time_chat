import { useRef, useEffect } from "react";

/**
 * useTyping Hook
 * Manages typing indicator state with debouncing
 */
const useTyping = ({ text, onTypingChange, textareaRef }) => {
  const typingTimeoutRef = useRef(null);

  // ============================================
  // TYPING INDICATOR WITH DEBOUNCE
  // ============================================
  useEffect(() => {
    if (!onTypingChange) return;

    // Start typing indicator if text exists
    if (text.trim()) {
      onTypingChange(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange(false);
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [text, onTypingChange]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (onTypingChange) {
        onTypingChange(false);
      }
    };
  }, [onTypingChange]);

  return {
    typingTimeoutRef,
  };
};

export default useTyping;