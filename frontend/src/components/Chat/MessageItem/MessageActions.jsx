// frontend/src/components/Chat/MessageItem/MessageActions.jsx
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function MessageActions({ isMe, isFailed, onReply, onCopy, onEdit, onDelete, onForward, onReact }) {
  const { t } = useTranslation("chat");
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const reactionsRef = useRef(null);

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

  const reactions = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  return (
    <div className={`flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 ${isMe ? "mr-1" : "ml-1"} relative`}>
      {/* Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all active:scale-95 shadow-sm"
          title={t("actions.react") || "React"}
          aria-label={t("actions.react") || "React to message"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Reactions Picker */}
        {showReactions && (
          <div
            ref={reactionsRef}
            className={`absolute ${isMe ? "right-0" : "left-0"} bottom-full mb-2 bg-white rounded-full shadow-xl border border-gray-200 px-2 py-1.5 flex gap-1 z-50`}
            style={{
              animation: 'scaleIn 0.15s ease-out'
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {/* Dropdown Menu (Messenger-style) */}
      {showMenu && (
        <div
          ref={menuRef}
          className={`absolute ${isMe ? "right-0" : "left-0"} bottom-full mb-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-40 z-50`}
          style={{
            animation: 'scaleIn 0.15s ease-out'
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

          {/* Delete (Only for own messages) */}
          {isMe && (
            <MenuItem
              icon={<DeleteIcon />}
              label={t("actions.delete") || "Delete"}
              onClick={() => handleAction(onDelete)}
              danger
            />
          )}
        </div>
      )}

      {/* Global keyframes - chỉ cần định nghĩa 1 lần */}
      {(showMenu || showReactions) && (
        <style dangerouslySetInnerHTML={{
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
          `
        }} />
      )}
    </div>
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
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ForwardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);