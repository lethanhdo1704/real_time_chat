// frontend/src/user/components/Chat/MessageItem/MessageActions/MessageActions.jsx

import { useState, useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../../context/AuthContext";
import { messageService } from "../../../../services/messageService";
import useChatStore from "../../../../store/chat/chatStore";
import { getSocket } from "../../../../services/socketService";

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
import ReactionPicker from "../ReactionPicker";

/**
 * MessageActions Component - WITH REACTIONS
 *
 * Features:
 * - Quick reactions (❤️ 😂 😮 😢 😡 👍 +)
 * - Reply to message
 * - More options menu
 * - Optimistic reaction updates
 * - Socket emission
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
  isOneToOneChat = true,
}) {
  const { t } = useTranslation("chat");
  const { token, user } = useContext(AuthContext);

  // Store actions
  const hideMessageLocal = useChatStore((state) => state.hideMessageLocal);
  const recallMessageFromSocket = useChatStore(
    (state) => state.recallMessageFromSocket
  );
  const toggleReactionOptimistic = useChatStore(
    (state) => state.toggleReactionOptimistic
  );

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
  const reactionButtonRef = useRef(null);

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
      setMenuPosition(
        spaceAbove < 250 && spaceBelow > spaceAbove ? "bottom" : "top"
      );
    }
  }, [showMenu]);

  useEffect(() => {
    if (showReactions && reactionButtonRef.current) {
      const rect = reactionButtonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setReactionsPosition(
        spaceAbove < 100 && spaceBelow > spaceAbove ? "bottom" : "top"
      );
    }
  }, [showReactions]);

  // ============================================
  // CLICK OUTSIDE HANDLER
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close menu
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }

      // Close reactions (handled by ReactionPicker)
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
  // 🆕 REACTION HANDLERS
  // ============================================
  /**
   * Handle reaction selection
   * Implements optimistic UI + socket emission
   */
  const handleReaction = (emoji) => {
    console.log("🎭 [MessageActions] handleReaction:", emoji);

    const messageId = message.messageId || message.uid;
    const userId = user.uid; // MongoDB uid

    if (!messageId || !userId) {
      console.error("❌ [MessageActions] Missing messageId or userId");
      return;
    }

    // 1️⃣ OPTIMISTIC UPDATE
    console.log("⚡ [MessageActions] Applying optimistic update");
    toggleReactionOptimistic(conversationId, messageId, emoji, userId, {
      uid: user.uid,
      nickname: user.nickname || user.fullName,
      avatar: user.avatar,
    });

    // 2️⃣ EMIT SOCKET EVENT
    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.error("❌ [MessageActions] Socket not connected");
      return;
    }

    console.log("📡 [MessageActions] Emitting message:react");
    socket.emit("message:react", {
      messageId,
      emoji,
    });

    // 3️⃣ CLOSE PICKER
    setShowReactions(false);
  };

  // ============================================
  // OTHER HANDLERS
  // ============================================
  const handleAction = (action) => {
    action();
    setShowMenu(false);
  };

  const handleRecallClick = () => {
    setShowMenu(false);
    setShowRecallModal(true);
  };

  const handleHideClick = () => {
    setShowMenu(false);
    setShowHideModal(true);
  };

  const handleEditClick = () => {
    setShowMenu(false);
    if (onEdit) {
      onEdit();
    }
  };

  const handleRecallConfirm = async (recallType) => {
    setShowRecallModal(false);
    if (loading) return;
    setLoading(true);

    try {
      const messageId = message.messageId || message.uid;

      if (recallType === "everyone") {
        console.log("↩️ Recalling message for everyone:", messageId);
        await messageService.recallMessage(messageId, token);

        const recalledBy = message.sender?.uid || message.sender;
        const recalledAt = new Date().toISOString();

        console.log("✅ API success - Updating local UI immediately");
        recallMessageFromSocket(
          conversationId,
          messageId,
          recalledBy,
          recalledAt
        );
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
      const messageId = message.messageId || message.uid;
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
  return (
    <>
      <div
        className={`flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 ${
          isMe ? "mr-1" : "ml-1"
        } relative`}
      >
        {/* 🆕 Reaction Button */}
        <div className="relative">
          <button
            ref={reactionButtonRef}
            onClick={() => setShowReactions(!showReactions)}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all active:scale-95 shadow-sm"
            title={t("actions.react") || "React"}
            aria-label={t("actions.react") || "React to message"}
          >
            <ReactIcon />
          </button>

          {/* Reaction Picker */}
          <ReactionPicker
            show={showReactions}
            onClose={() => setShowReactions(false)}
            onEmojiSelect={handleReaction}
            position={reactionsPosition}
            isMe={isMe}
          />
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
            onEdit={handleEditClick}
            onRecall={handleRecallClick}
            onHide={handleHideClick}
            t={t}
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