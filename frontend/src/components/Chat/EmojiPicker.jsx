// frontend/src/components/EmojiPicker.jsx
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import EmojiPickerReact from "emoji-picker-react";

export default function EmojiPicker({ show, onClose, onEmojiClick }) {
  const pickerRef = useRef(null);
  const { t } = useTranslation("chat");

  // Override category labels với MutationObserver
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

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 z-50 rounded-2xl shadow-2xl overflow-hidden"
      style={{ animation: "fadeIn 0.2s ease-out" }}
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
    </div>
  );
}