// frontend/src/user/components/Chat/MessageItem/MessageActions.jsx
import { useState, useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../../context/AuthContext";
import { messageService } from "../../../../services/messageService";
import useChatStore from "../../../../store/chat/chatStore";

// Import helpers
import {
  updateConversationLastMessage,
  canRecall,
  canHide,
} from "./MessageActions.helpers";

// Import UI components
import { ReactIcon, ReplyIcon, MoreIcon } from "./MessageActions.icons";
import { ActionsMenu } from "./MessageActions.menu";
import { MessageModals } from "./MessageActions.modals";

/**
 * MessageActions Component - Refactored
 * 
 * Main component that orchestrates all message actions
 * Delegates logic to helper functions and UI to subcomponents
 */
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

  // ============================================
  // STATE
  // ============================================
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuPosition, setMenuPosition] = useState("top");
  const [reactionsPosition, setReactionsPosition] = useState("top");

  // ============================================
  // REFS
  // ============================================
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const reactionsRef = useRef(null);

  // ============================================
  // PERMISSIONS
  // ============================================
  const canRecallMessage = canRecall(message, isMe);
  const canHideMessage = canHide(message);

  // ============================================
  // POSITION CALCULATION
  // ============================================
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuPosition(spaceAbove < 250 && spaceBelow > spaceAbove ? "bottom" : "top");
    }
  }, [showMenu]);

  useEffect(() => {
    if (showReactions && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setReactionsPosition(spaceAbove < 60 && spaceBelow > spaceAbove ? "bottom" : "top");
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

      if (reactionsRef.current && !reactionsRef.current.contains(event.target)) {
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

  const handleRecallClick = () => {
    setShowMenu(false);
    setShowRecallModal(true);
  };

  const handleHideClick = () => {
    setShowMenu(false);
    setShowHideModal(true);
  };

  const handleRecallConfirm = async (recallType) => {
    setShowRecallModal(false);
    if (loading) return;
    setLoading(true);

    try {
      const messageId = message.messageId || message._id;

      if (recallType === "everyone") {
        console.log("↩️ Recalling message for everyone:", messageId);
        await messageService.recallMessage(messageId, token);

        const recalledBy = message.sender?._id || message.sender;
        const recalledAt = new Date().toISOString();

        console.log("✅ API success - Updating local UI immediately");
        recallMessageFromSocket(conversationId, messageId, recalledBy, recalledAt);
        updateConversationLastMessage(conversationId, messageId);

        console.log("✅ Message recalled successfully");
      } else {
        console.log("🗑️ Deleting for me:", messageId);
        await messageService.deleteForMe(messageId, token);

        hideMessageLocal(conversationId, messageId);
        updateConversationLastMessage(conversationId, messageId);

        console.log("✅ Message deleted for me");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleHideConfirm = async () => {
    setShowHideModal(false);
    if (loading) return;
    setLoading(true);

    try {
      const messageId = message.messageId || message._id;
      console.log("👁️‍🗨️ Hiding message:", messageId);

      await messageService.hideMessage(messageId, token);

      hideMessageLocal(conversationId, messageId);
      updateConversationLastMessage(conversationId, messageId);

      console.log("✅ Message hidden successfully");
    } catch (error) {
      console.error("❌ Hide message error:", error);
      alert(error.message || "Không thể gỡ tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
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
            <ReactIcon />
          </button>

          {/* Reactions Picker */}
          {showReactions && (
            <div
              ref={reactionsRef}
              className={`
                absolute ${isMe ? "right-0" : "left-0"} 
                ${reactionsPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"}
                bg-white rounded-full shadow-xl border border-gray-200 
                px-2 py-1.5 flex gap-1 z-50
              `}
              style={{ animation: "scaleIn 0.15s ease-out" }}
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
          <ReplyIcon />
        </button>

        {/* More Menu Button */}
        <button
          ref={buttonRef}
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all active:scale-95 shadow-sm"
          title={t("actions.more") || "More options"}
          aria-label={t("actions.more") || "More options"}
        >
          <MoreIcon />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <ActionsMenu
            menuRef={menuRef}
            isMe={isMe}
            isFailed={isFailed}
            menuPosition={menuPosition}
            isOneToOneChat={isOneToOneChat}
            canRecall={canRecallMessage}
            canHide={canHideMessage}
            onAction={handleAction}
            onCopy={onCopy}
            onForward={onForward}
            onEdit={onEdit}
            onRecall={handleRecallClick}
            onHide={handleHideClick}
            t={t}
          />
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

      {/* Modals */}
      <MessageModals
        showRecallModal={showRecallModal}
        showHideModal={showHideModal}
        onCloseRecall={() => setShowRecallModal(false)}
        onCloseHide={() => setShowHideModal(false)}
        onConfirmRecall={handleRecallConfirm}
        onConfirmHide={handleHideConfirm}
      />
    </>
  );
}