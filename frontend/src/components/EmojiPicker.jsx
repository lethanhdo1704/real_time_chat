// frontend/src/components/EmojiPicker.jsx
import { useRef, useEffect } from "react";
import EmojiPickerReact from "emoji-picker-react";

export default function EmojiPicker({ show, onClose, onEmojiClick }) {
  const pickerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden"
      style={{
        animation: "fadeIn 0.2s ease-out"
      }}
    >
      <EmojiPickerReact
        onEmojiClick={onEmojiClick}
        autoFocusSearch={false}
        theme="light"
        searchPlaceHolder="Tìm emoji..."
        width={350}
        height={400}
        previewConfig={{
          showPreview: false
        }}
        skinTonesDisabled
        lazyLoadEmojis={true}
      />
    </div>
  );
}