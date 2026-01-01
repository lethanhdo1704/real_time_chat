import { useState, useRef, useCallback } from "react";

/**
 * useEmojiInput Hook
 * Manages emoji picker state and emoji insertion logic
 */
const useEmojiInput = ({ setText, textareaRef }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef(null);

  // ============================================
  // EMOJI INSERTION
  // ============================================
  const handleEmojiClick = useCallback((emojiObject) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const emoji = emojiObject.emoji;
    
    const currentText = textarea.value;
    const newText = currentText.substring(0, start) + emoji + currentText.substring(end);

    setText(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);

      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }, 0);
  }, [setText, textareaRef]);

  // ============================================
  // TOGGLE EMOJI PICKER
  // ============================================
  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

  return {
    showEmojiPicker,
    setShowEmojiPicker,
    emojiButtonRef,
    handleEmojiClick,
    toggleEmojiPicker,
  };
};

export default useEmojiInput;