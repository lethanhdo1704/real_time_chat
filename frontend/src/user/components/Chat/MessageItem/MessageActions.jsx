// frontend/src/components/Chat/MessageItem/MessageActions.jsx
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import RecallMessageModal from "./RecallMessageModal";
import HideMessageModal from "./HideMessageModal";

export default function MessageActions({
  isMe,
  isFailed,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onForward,
  onReact,
  onHide, // 🔥 NEW: Hide message for other's messages
  isOneToOneChat = true, // 🔥 NEW: Check if it's 1-1 chat
}) {
  const { t } = useTranslation("chat");
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false); // 🔥 NEW: Hide confirmation

  // 🔥 NEW: Smart positioning state
  const [menuPosition, setMenuPosition] = useState("top"); // 'top' or 'bottom'
  const [reactionsPosition, setReactionsPosition] = useState("top"); // 'top' or 'bottom'

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const reactionsRef = useRef(null);

  // 🔥 NEW: Calculate position when menu opens
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // If not enough space above (less than 250px), show below
      setMenuPosition(
        spaceAbove < 250 && spaceBelow > spaceAbove ? "bottom" : "top"
      );
    }
  }, [showMenu]);

  // 🔥 NEW: Calculate position for reactions
  useEffect(() => {
    if (showReactions && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // If not enough space above (less than 60px), show below
      setReactionsPosition(
        spaceAbove < 60 && spaceBelow > spaceAbove ? "bottom" : "top"
      );
    }
  }, [showReactions]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }

      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(event.target)
      ) {
        setShowReactions(false);
      }
    };

    if (showMenu || showReactions) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMenu, showReactions]);

  const handleAction = (action) => {
    action();
    setShowMenu(false);
  };

  const handleReaction = (emoji) => {
    if (onReact) {
      onReact(emoji);
    }
    setShowReactions(false);
  };

  // 🔥 Handle recall button click
  const handleRecallClick = () => {
    setShowMenu(false);
    setShowRecallModal(true);
  };

  // 🔥 Handle recall confirmation
  const handleRecallConfirm = (recallType) => {
    if (onDelete) {
      // recallType: 'everyone' or 'me'
      onDelete(recallType);
    }
    setShowRecallModal(false);
  };

  // 🔥 NEW: Handle hide message click
  const handleHideClick = () => {
    setShowMenu(false);
    setShowHideConfirm(true);
  };

  // 🔥 NEW: Handle hide confirmation
  const handleHideConfirm = () => {
    if (onHide) {
      onHide();
    }
    setShowHideConfirm(false);
  };

  const reactions = ["❤️", "😂", "😮", "😢", "😡", "👍"];

  return (
    <>
      <div
        className={`flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 ${
          isMe ? "mr-1" : "ml-1"
        } relative`}
      >
        {/* Reaction Button */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all active:scale-95 shadow-sm"
            title={t("actions.react") || "React"}
            aria-label={t("actions.react") || "React to message"}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* 🔥 IMPROVED: Reactions Picker with Smart Positioning */}
          {showReactions && (
            <div
              ref={reactionsRef}
              className={`
                absolute ${isMe ? "right-0" : "left-0"} 
                ${
                  reactionsPosition === "top"
                    ? "bottom-full mb-2"
                    : "top-full mt-2"
                }
                bg-white rounded-full shadow-xl border border-gray-200 
                px-2 py-1.5 flex gap-1 z-50
              `}
              style={{
                animation: "scaleIn 0.15s ease-out",
              }}
            >
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform active:scale-110 p-1"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply Button */}
        <button
          onClick={onReply}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all active:scale-95 shadow-sm"
          title={t("actions.reply") || "Reply"}
          aria-label={t("actions.reply") || "Reply to message"}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>

        {/* More Menu Button */}
        <button
          ref={buttonRef}
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all active:scale-95 shadow-sm"
          title={t("actions.more") || "More options"}
          aria-label={t("actions.more") || "More options"}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {/* 🔥 IMPROVED: Dropdown Menu with Smart Positioning */}
        {showMenu && (
          <div
            ref={menuRef}
            className={`
              absolute ${isMe ? "right-0" : "left-0"} 
              ${menuPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"}
              bg-white rounded-lg shadow-xl border border-gray-200 
              py-1 min-w-40 z-50
            `}
            style={{
              animation: "scaleIn 0.15s ease-out",
            }}
          >
            {/* Copy */}
            <MenuItem
              icon={<CopyIcon />}
              label={t("actions.copy") || "Copy"}
              onClick={() => handleAction(onCopy)}
            />

            {/* Forward */}
            <MenuItem
              icon={<ForwardIcon />}
              label={t("actions.forward") || "Forward"}
              onClick={() => handleAction(onForward)}
            />

            {/* Edit (Only for own messages) */}
            {isMe && !isFailed && (
              <MenuItem
                icon={<EditIcon />}
                label={t("actions.edit") || "Edit"}
                onClick={() => handleAction(onEdit)}
              />
            )}

            {/* Divider */}
            {isMe && <div className="h-px bg-gray-200 my-1" />}

            {/* 🔥 RECALL (Replace Delete - Only for own messages) */}
            {isMe && (
              <MenuItem
                icon={<RecallIcon />}
                label={t("actions.recallButton") || "Thu hồi"}
                onClick={handleRecallClick}
                danger
              />
            )}

            {/* 🔥 NEW: HIDE (Only for other's messages in 1-1 chat) */}
            {!isMe && isOneToOneChat && (
              <>
                <div className="h-px bg-gray-200 my-1" />
                <MenuItem
                  icon={<HideIcon />}
                  label={t("actions.hideButton") || "Ẩn tin nhắn"}
                  onClick={handleHideClick}
                  danger
                />
              </>
            )}
          </div>
        )}

        {/* Global keyframes */}
        {(showMenu || showReactions) && (
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
        )}
      </div>

      {/* 🔥 RECALL MESSAGE MODAL */}
      <RecallMessageModal
        isOpen={showRecallModal}
        onClose={() => setShowRecallModal(false)}
        onConfirm={handleRecallConfirm}
      />

      {/* 🔥 NEW: HIDE MESSAGE MODAL */}
      <HideMessageModal
        isOpen={showHideConfirm}
        onClose={() => setShowHideConfirm(false)}
        onConfirm={handleHideConfirm}
      />
    </>
  );
}

// ============================================
// MENU ITEM COMPONENT
// ============================================
function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
        danger
          ? "hover:bg-red-50 text-red-600"
          : "hover:bg-gray-100 text-gray-700"
      }`}
    >
      <span className={danger ? "text-red-500" : "text-gray-500"}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// ============================================
// ICON COMPONENTS
// ============================================
const CopyIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const ForwardIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7l5 5m0 0l-5 5m5-5H6"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const RecallIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
    />
  </svg>
);

const HideIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);
