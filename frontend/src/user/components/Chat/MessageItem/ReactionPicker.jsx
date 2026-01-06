// frontend/src/user/components/Chat/MessageItem/ReactionPicker.jsx

import { useRef, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import EmojiPicker from "../EmojiPicker";
import { useTranslation } from "react-i18next";

/**
 * ReactionPicker Component - SMART POSITIONING + i18n
 * 
 * Quick reactions popup: ❤️ 😂 😮 😢 😡 👍 + [+] button
 * 
 * Features:
 * - Quick emoji selection (6 most common)
 * - [+] button opens full EmojiPickerReact
 * - ✅ SMART: Auto-position to never overflow viewport
 * - ✅ SMART: Adjusts horizontal position near screen edges
 * - ✅ Full i18n support
 * - Click outside to close
 * - Smooth animations
 * 
 * @param {object} props
 * @param {boolean} props.show - Show/hide picker
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onEmojiSelect - Emoji selection callback
 * @param {string} props.position - Initial "top" or "bottom" (will auto-adjust)
 * @param {boolean} props.isMe - Is current user's message?
 */
export default function ReactionPicker({
  show,
  onClose,
  onEmojiSelect,
  position = "top",
  isMe = false,
}) {
  const { t } = useTranslation("chat");
  const pickerRef = useRef(null);
  const plusButtonRef = useRef(null);
  const [showFullPicker, setShowFullPicker] = useState(false);
  
  // ✅ SMART POSITIONING STATE
  const [smartPosition, setSmartPosition] = useState({
    vertical: position,
    horizontal: isMe ? "right" : "left",
  });

  // Quick reactions (most common) with i18n labels
  const quickReactions = [
    { emoji: "❤️", label: t("reactions.heart") },
    { emoji: "😂", label: t("reactions.laugh") },
    { emoji: "😮", label: t("reactions.wow") },
    { emoji: "😢", label: t("reactions.sad") },
    { emoji: "😡", label: t("reactions.angry") },
    { emoji: "👍", label: t("reactions.thumbsup") },
  ];

  // ============================================
  // ✅ SMART POSITIONING CALCULATION
  // ============================================
  useEffect(() => {
    if (show && pickerRef.current) {
      const calculatePosition = () => {
        const picker = pickerRef.current;
        const rect = picker.getBoundingClientRect();
        const margin = 8; // Safety margin

        let vertical = position;
        let horizontal = isMe ? "right" : "left";

        // ============================================
        // VERTICAL POSITIONING
        // ============================================
        
        // Check if overflows top
        if (rect.top < margin) {
          vertical = "bottom";
          console.log("🔄 [ReactionPicker] Adjusted to bottom (overflow top)");
        }
        
        // Check if overflows bottom
        if (rect.bottom > window.innerHeight - margin) {
          vertical = "top";
          console.log("🔄 [ReactionPicker] Adjusted to top (overflow bottom)");
        }

        // ============================================
        // HORIZONTAL POSITIONING
        // ============================================
        
        // Check if overflows left
        if (rect.left < margin) {
          horizontal = "left";
          console.log("🔄 [ReactionPicker] Adjusted to left (overflow left edge)");
        }
        
        // Check if overflows right
        if (rect.right > window.innerWidth - margin) {
          horizontal = "right";
          console.log("🔄 [ReactionPicker] Adjusted to right (overflow right edge)");
        }

        // ============================================
        // MOBILE: Always center horizontally if too narrow
        // ============================================
        if (window.innerWidth < 640) { // sm breakpoint
          if (rect.width > window.innerWidth * 0.9) {
            horizontal = "center";
            console.log("📱 [ReactionPicker] Centered for mobile");
          }
        }

        setSmartPosition({ vertical, horizontal });
      };

      // Calculate immediately
      calculatePosition();

      // Recalculate on resize
      window.addEventListener("resize", calculatePosition);
      return () => window.removeEventListener("resize", calculatePosition);
    }
  }, [show, position, isMe]);

  // ============================================
  // CLICK OUTSIDE HANDLER
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        plusButtonRef.current &&
        !plusButtonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (show) {
      // Delay to avoid immediate close on open
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [show, onClose]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleQuickReaction = (emoji) => {
    console.log("🎭 [ReactionPicker] Quick reaction selected:", emoji);
    onEmojiSelect(emoji);
    onClose();
  };

  const handleFullPickerOpen = () => {
    console.log("➕ [ReactionPicker] Opening full emoji picker");
    setShowFullPicker(true);
  };

  const handleFullPickerClose = () => {
    console.log("✖️ [ReactionPicker] Closing full emoji picker");
    setShowFullPicker(false);
  };

  const handleFullPickerSelect = (emojiData) => {
    console.log("🎭 [ReactionPicker] Full picker emoji selected:", emojiData);
    onEmojiSelect(emojiData.emoji);
    setShowFullPicker(false);
    onClose();
  };

  if (!show) return null;

  // ============================================
  // ✅ DYNAMIC POSITIONING CLASSES
  // ============================================
  const getPositionClasses = () => {
    const { vertical, horizontal } = smartPosition;
    
    let classes = "absolute ";

    // Vertical
    if (vertical === "top") {
      classes += "bottom-full mb-2 ";
    } else {
      classes += "top-full mt-2 ";
    }

    // Horizontal
    if (horizontal === "center") {
      classes += "left-1/2 -translate-x-1/2 ";
    } else if (horizontal === "right") {
      classes += "right-0 ";
    } else {
      classes += "left-0 ";
    }

    return classes;
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {/* Quick Reactions Bar */}
      <div
        ref={pickerRef}
        className={`
          ${getPositionClasses()}
          bg-white rounded-full shadow-xl border border-gray-200 
          px-2 py-1.5 flex items-center gap-1 z-50
          transition-all duration-200
          max-w-[90vw] sm:max-w-none
        `}
        style={{ animation: "scaleIn 0.15s ease-out" }}
      >
        {/* Quick Emojis */}
        {quickReactions.map((reaction) => (
          <button
            key={reaction.emoji}
            onClick={() => handleQuickReaction(reaction.emoji)}
            className="
              text-xl hover:scale-125 transition-transform 
              active:scale-110 p-1 rounded-full
              hover:bg-gray-100 shrink-0 cursor-pointer
            "
            title={t("reactions.reactWith", { emoji: reaction.label })}
            aria-label={t("reactions.reactWith", { emoji: reaction.label })}
          >
            {reaction.emoji}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />

        {/* Plus Button (Full Picker) */}
        <button
          ref={plusButtonRef}
          onClick={handleFullPickerOpen}
          className="
            p-1.5 rounded-full hover:bg-gray-100 
            transition-colors text-gray-600 hover:text-gray-800
            shrink-0 cursor-pointer
          "
          title={t("reactions.more")}
          aria-label={t("reactions.showMore")}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Full Emoji Picker */}
      {showFullPicker && (
        <EmojiPicker
          show={showFullPicker}
          onClose={handleFullPickerClose}
          onEmojiClick={handleFullPickerSelect}
          emojiButtonRef={plusButtonRef}
        />
      )}

      {/* Animation CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `,
        }}
      />
    </>
  );
}