// ============================================
// COMPLETE FIX: MessageActions.jsx
// ✅ Optimistic Update + Socket Sync
// ============================================

// frontend/src/user/components/Chat/MessageItem/MessageActions.jsx
import { useState, useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../context/AuthContext";
import { messageService } from "../../../services/messageService";
import useChatStore from "../../../store/chat/chatStore";
import RecallMessageModal from "./RecallMessageModal";
import HideMessageModal from "./HideMessageModal";

export default function MessageActions({
  message,
  conversationId,
  isMe,
  isFailed,
  onReply,
  onCopy,
  onEdit,
  onForward,
  onReact,
  isOneToOneChat = true,
}) {
  const { t } = useTranslation("chat");
  const { token } = useContext(AuthContext);
  
  // Store actions
  const hideMessageLocal = useChatStore((state) => state.hideMessageLocal);
  const recallMessageFromSocket = useChatStore((state) => state.recallMessageFromSocket);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [menuPosition, setMenuPosition] = useState("top");
  const [reactionsPosition, setReactionsPosition] = useState("top");

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const reactionsRef = useRef(null);

  // ============================================
  // PERMISSION CHECKS
  // ============================================

  const canRecall = () => {
    if (!isMe) return false;
    if (message.isRecalled) return false;
    if (message.deletedAt) return false;
    return true; // ✅ No time limit
  };

  const canHide = !message.deletedAt && !message.isRecalled;
  const canDeleteForMe = isMe && !message.deletedAt && !message.isRecalled;

  // ============================================
  // POSITION CALCULATION
  // ============================================

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuPosition(
        spaceAbove < 250 && spaceBelow > spaceAbove ? "bottom" : "top"
      );
    }
  }, [showMenu]);

  useEffect(() => {
    if (showReactions && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setReactionsPosition(
        spaceAbove < 60 && spaceBelow > spaceAbove ? "bottom" : "top"
      );
    }
  }, [showReactions]);

  // ============================================
  // CLICK OUTSIDE HANDLER
  // ============================================

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

  // ============================================
  // HANDLERS
  // ============================================

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

  /**
   * 🔥 KIỂU 3: Recall Message (Thu hồi)
   * ✅ OPTIMISTIC UPDATE: Update UI immediately, socket syncs others
   */
  const handleRecallClick = () => {
    setShowMenu(false);
    setShowRecallModal(true);
  };

  const handleRecallConfirm = async (recallType) => {
    setShowRecallModal(false);
    
    if (loading) return;
    setLoading(true);

    try {
      const messageId = message.messageId || message._id;

      if (recallType === "everyone") {
        // KIỂU 3: Thu hồi cho mọi người
        console.log("↩️ Recalling message for everyone:", messageId);
        
        // Call API
        await messageService.recallMessage(messageId, token);
        
        // ✅ OPTIMISTIC UPDATE: Update local UI immediately
        // Socket event will sync other clients (if connected)
        const recalledBy = message.sender?._id || message.sender;
        const recalledAt = new Date().toISOString();
        
        console.log("✅ API success - Updating local UI immediately");
        recallMessageFromSocket(conversationId, messageId, recalledBy, recalledAt);
        
        console.log("✅ Message recalled successfully");
        console.log("📡 Socket will sync to other users automatically");
        
      } else {
        // KIỂU 2: Xóa cho mình (Local only)
        console.log("🗑️ Deleting for me:", messageId);
        
        await messageService.deleteForMe(messageId, token);
        
        // Update local state only
        hideMessageLocal(conversationId, messageId);
        console.log("✅ Message deleted for me");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔥 KIỂU 1: Hide Message (Gỡ tin nhắn)
   */
  const handleHideClick = () => {
    setShowMenu(false);
    setShowHideModal(true);
  };

  const handleHideConfirm = async () => {
    setShowHideModal(false);
    
    if (loading) return;
    setLoading(true);

    try {
      const messageId = message.messageId || message._id;
      
      console.log("👁️‍🗨️ Hiding message:", messageId);
      
      await messageService.hideMessage(messageId, token);
      
      // Update local state only
      hideMessageLocal(conversationId, messageId);
      console.log("✅ Message hidden successfully");
      
    } catch (error) {
      console.error("❌ Hide message error:", error);
      alert(error.message || "Không thể gỡ tin nhắn");
    } finally {
      setLoading(false);
    }
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

          {/* Reactions Picker */}
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

        {/* Dropdown Menu */}
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
            {(isMe || (!isMe && isOneToOneChat && canHide)) && (
              <div className="h-px bg-gray-200 my-1" />
            )}

            {/* 🔥 RECALL (Only for own messages - NO TIME LIMIT) */}
            {isMe && canRecall() && (
              <MenuItem
                icon={<RecallIcon />}
                label={t("actions.recallButton") || "Thu hồi"}
                onClick={handleRecallClick}
                danger
              />
            )}

            {/* 🔥 HIDE (Only for other's messages in 1-1 chat) */}
            {!isMe && isOneToOneChat && canHide && (
              <MenuItem
                icon={<HideIcon />}
                label={t("actions.hideButton") || "Gỡ tin nhắn"}
                onClick={handleHideClick}
                danger
              />
            )}
          </div>
        )}

        {/* Animations */}
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

      {/* 🔥 HIDE MESSAGE MODAL */}
      <HideMessageModal
        isOpen={showHideModal}
        onClose={() => setShowHideModal(false)}
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

// ============================================
// 📋 HOW IT WORKS
// ============================================
/*
FLOW:
1. User clicks "Thu hồi tin nhắn"
2. API call: POST /messages/:id/recall
3. ✅ OPTIMISTIC UPDATE: recallMessageFromSocket() - Updates current user's UI immediately
4. Backend emits: socket "message_recalled" event
5. Other users receive socket event → Their UI updates via useChatSocket listener
6. If socket disconnected → Current user still sees recall, others get it on reconnect/refresh

WHY THIS WORKS:
- Current user: Sees change immediately (no socket needed)
- Other users: Get realtime update if socket connected
- Socket down: Current user still works, others catch up later
- Best of both worlds: Instant feedback + eventual consistency
*/