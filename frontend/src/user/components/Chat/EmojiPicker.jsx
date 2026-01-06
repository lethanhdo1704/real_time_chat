// frontend/src/components/Chat/EmojiPicker.jsx
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import EmojiPickerReact from "emoji-picker-react";

export default function EmojiPicker({ show, onClose, onEmojiClick, emojiButtonRef }) {
  const pickerRef = useRef(null);
  const { t } = useTranslation("chat");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isReady, setIsReady] = useState(false);

  // 🎯 Calculate exact position BEFORE showing
  useEffect(() => {
    if (!show || !emojiButtonRef?.current) {
      setIsReady(false);
      return;
    }

    const calculatePosition = () => {
      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      const pickerWidth = 350;
      const pickerHeight = 400;
      
      // Position above button, aligned to right
      const top = buttonRect.top - pickerHeight - 8; // 8px gap
      const left = buttonRect.right - pickerWidth;

      // Prevent overflow on left edge
      const finalLeft = Math.max(8, left);
      
      // Prevent overflow on top edge
      const finalTop = Math.max(8, top);

      setPosition({ top: finalTop, left: finalLeft });
      
      // Show after position calculated
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    };

    calculatePosition();
    
    // Recalculate on scroll/resize
    window.addEventListener("scroll", calculatePosition, true);
    window.addEventListener("resize", calculatePosition);

    return () => {
      window.removeEventListener("scroll", calculatePosition, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [show, emojiButtonRef]);

  // Override category labels
  useEffect(() => {
    if (!show || !pickerRef.current) return;

    const categoryLabels = {
      "Smileys & People": t("emoji.smileys_people"),
      "Animals & Nature": t("emoji.animals_nature"),
      "Food & Drink": t("emoji.food_drink"),
      "Travel & Places": t("emoji.travel_places"),
      "Activities": t("emoji.activities"),
      "Objects": t("emoji.objects"),
      "Symbols": t("emoji.symbols"),
      "Flags": t("emoji.flags"),
      "Frequently Used": t("emoji.suggested")
    };

    const replaceText = () => {
      const walker = document.createTreeWalker(
        pickerRef.current,
        NodeFilter.SHOW_TEXT
      );

      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent.trim();
        if (categoryLabels[text]) {
          node.textContent = categoryLabels[text];
        }
      }
    };

    replaceText();

    const observer = new MutationObserver(replaceText);
    observer.observe(pickerRef.current, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [show, t]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        emojiButtonRef?.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (show) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose, emojiButtonRef]);

  // Close with ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (show) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [show, onClose]);

  if (!show) return null;

  // 🔥 Render as portal at body level with fixed positioning
  return createPortal(
    <div
      ref={pickerRef}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="fixed z-50 rounded-2xl shadow-2xl overflow-hidden transition-opacity duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity: isReady ? 1 : 0,
        pointerEvents: isReady ? "auto" : "none"
      }}
    >
      <EmojiPickerReact
        onEmojiClick={onEmojiClick}
        autoFocusSearch={false}
        theme="light"
        width={350}
        height={400}
        searchPlaceholder={t("emoji.search")}
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
        lazyLoadEmojis
      />
    </div>,
    document.body
  );
}