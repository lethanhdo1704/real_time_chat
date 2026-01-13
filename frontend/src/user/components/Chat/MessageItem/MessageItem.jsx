// frontend/src/user/components/Chat/MessageItem/MessageItem.jsx

import { format } from "date-fns";
import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../context/AuthContext";
import { messageService } from "../../../services/messageService";
import { isBigEmoji } from "../../../utils/emoji";
import { getSocket } from "../../../services/socketService";
import MessageSenderInfo from "./MessageSenderInfo";
import MessageBubble from "./MessageBubble";
import MessageActions from "./MessageActions";
import MessageStatus from "./MessageStatus";
import MessageReactions from "./MessageReactions";
import AvatarImage from "../../common/AvatarImage";
import useChatStore from "../../../store/chat/chatStore";

/**
 * MessageItem Component - WITH AVATAR DISPLAY
 * ✅ Shows sender avatar next to their messages
 * ✅ Avatar only appears on the last message in a group
 * ✅ Complete with reactions and all features
 */
export default function MessageItem({
  message,
  conversationId,
  isMe,
  isGroupChat,
  isPrivateChat,
  showSender = false,
  isLastInGroup = true,
  onRetryMessage,
  isHighlighted = false,
}) {
  const { t } = useTranslation("chat");
  const { token, user } = useContext(AuthContext);

  // Local state for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Store actions
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const setHighlightedMessage = useChatStore(
    (state) => state.setHighlightedMessage
  );
  const editMessageLocal = useChatStore((state) => state.editMessageLocal);
  const toggleReactionOptimistic = useChatStore(
    (state) => state.toggleReactionOptimistic
  );

  // Subscribe to readReceipts for THIS conversation
  const conversationReceipts = useChatStore((state) =>
    state.readReceipts?.get(conversationId)
  );

  // ============================================
  // MESSAGE DATA
  // ============================================
  const messageId = message.messageId || message.uid;
  const isRecalled = message.isRecalled || false;
  const messageText = message.content || message.text || "";
  const isBig = !isRecalled && isBigEmoji(messageText);
  const isPending =
    message.status === "pending" || message._status === "sending";
  const isFailed = message.status === "failed" || message._status === "failed";

  // ============================================
  // EDIT PERMISSIONS
  // ============================================
  const canEdit = () => {
    if (!isMe) return false;
    if (isRecalled) return false;
    if (isFailed) return false;

    // Check 15-minute time limit
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    return messageAge < FIFTEEN_MINUTES;
  };

  // ============================================
  // READ RECEIPTS LOGIC
  // ============================================
  const readUsers = conversationReceipts
    ? (conversationReceipts.get(messageId) || []).filter(
        (u) => u.userUid !== message.sender?.uid
      )
    : [];

  const showReadReceipts = isMe && readUsers.length > 0;

  // ============================================
  // SENDER INFO
  // ============================================
  const senderInfo =
    !showSender || isMe
      ? null
      : {
          name:
            message.sender?.nickname || message.sender?.fullName || "Unknown",
          avatar: message.sender?.avatar,
        };

  // ============================================
  // READ STATUS
  // ============================================
  const getReadStatus = () => {
    if (!isMe || !isPrivateChat) return null;

    if (isFailed) {
      return {
        text: t("message.failed") || "Failed",
        color: "text-red-500",
      };
    }

    if (isPending) {
      return {
        text: t("message.sending") || "Sending...",
        color: "text-gray-400",
      };
    }

    return null;
  };

  const readStatus = getReadStatus();

  // ============================================
  // REPLY HANDLERS
  // ============================================
  const handleReply = () => {
    if (!conversationId) {
      console.error("❌ No conversationId provided to MessageItem");
      return;
    }

    if (isRecalled) return;

    const messageData = {
      messageId: message.messageId || message.uid,
      content: message.content,
      type: message.type || "text",
      sender: message.sender,
      createdAt: message.createdAt,
    };

    console.log("✅ Setting reply with conversationId:", conversationId);
    setReplyingTo(conversationId, messageData);
  };

  const handleReplyClick = (replyToId) => {
    if (!conversationId) return;

    console.log("🎯 Scrolling to replied message:", replyToId);

    const messageElement = document.getElementById(`message-${replyToId}`);

    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setHighlightedMessage(conversationId, replyToId);
    } else {
      console.warn("⚠️ Replied message not found in DOM:", replyToId);
    }
  };

  // ============================================
  // EDIT HANDLERS
  // ============================================
  const handleEditClick = () => {
    if (!canEdit()) {
      console.warn("⚠️ Cannot edit this message");
      return;
    }

    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async (newContent) => {
    if (!newContent.trim()) {
      setEditError(t("errors.contentEmpty") || "Nội dung không được để trống");
      return;
    }

    if (newContent.trim() === messageText.trim()) {
      console.log("⏭️ Content unchanged, skipping edit");
      setIsEditing(false);
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      console.log("📝 Calling API to edit message:", messageId);

      const response = await messageService.editMessage(
        messageId,
        newContent,
        token
      );

      console.log("✅ API Response:", response);

      // Update in store
      editMessageLocal(conversationId, messageId, newContent);

      setIsEditing(false);
      console.log("✅ Message edited successfully");
    } catch (error) {
      console.error("❌ Edit message error:", error);

      let errorMessage = error.message || "Không thể chỉnh sửa tin nhắn";

      if (error.message.includes("NOT_SENDER")) {
        errorMessage =
          t("errors.notSender") || "Bạn không phải người gửi tin nhắn này";
      } else if (error.message.includes("EDIT_TIME_EXPIRED")) {
        errorMessage =
          t("errors.editTimeExpired") || "Đã quá 15 phút, không thể chỉnh sửa";
      } else if (error.message.includes("MESSAGE_RECALLED")) {
        errorMessage =
          t("errors.messageRecalled") ||
          "Không thể chỉnh sửa tin nhắn đã thu hồi";
      } else if (error.message.includes("MESSAGE_DELETED")) {
        errorMessage =
          t("errors.messageDeleted") || "Không thể chỉnh sửa tin nhắn đã xóa";
      } else if (error.message.includes("CONTENT_TOO_LONG")) {
        errorMessage =
          t("errors.contentTooLong") || "Nội dung quá dài (tối đa 5000 ký tự)";
      }

      setEditError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  // ============================================
  // REACTION HANDLERS
  // ============================================
  const handleReactionClick = (emoji) => {
    console.log("🎭 [MessageItem] Reaction clicked:", emoji);

    const userId = user.uid;

    if (!userId) {
      console.error("❌ [MessageItem] No user ID");
      return;
    }

    // 1️⃣ OPTIMISTIC UPDATE
    console.log("⚡ [MessageItem] Applying optimistic update");
    toggleReactionOptimistic(conversationId, messageId, emoji, userId, {
      uid: user.uid,
      nickname: user.nickname || user.fullName,
      avatar: user.avatar,
    });

    // 2️⃣ EMIT SOCKET EVENT
    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.error("❌ [MessageItem] Socket not connected");
      return;
    }

    console.log("📡 [MessageItem] Emitting message:react");
    socket.emit("message:react", {
      messageId,
      emoji,
    });
  };

  // ============================================
  // OTHER HANDLERS
  // ============================================
  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
  };

  const handleForward = () => {
    console.log("Forward message:", message.uid);
  };

  const handleRetry = () => {
    if (onRetryMessage) {
      onRetryMessage(message);
    }
  };

  const formatTime = (date) => {
    try {
      return format(new Date(date), "HH:mm");
    } catch {
      return "";
    }
  };

  // ============================================
  // REACTIONS DATA
  // ============================================
  const reactions = message?.reactions || [];
  const hasReactions = reactions.length > 0;

  // ============================================
  // RECALLED MESSAGE RENDER
  // ============================================
  if (isRecalled) {
    return (
      <div
        id={`message-${messageId}`}
        className={`flex w-full ${
          isMe ? "justify-end" : "justify-start"
        } group relative`}
      >
        <div
          className={`flex w-full flex-col ${
            isMe ? "items-end" : "items-start"
          } max-w-[85%] sm:max-w-[75%]`}
        >
          {senderInfo && <MessageSenderInfo {...senderInfo} />}

          <div
            className={`inline-flex items-center gap-2 rounded-2xl ${
              isMe ? "rounded-br-md" : "rounded-bl-md"
            } px-4 py-2.5 bg-gray-100 text-gray-500 border border-gray-200`}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span className="text-sm italic">
              {isMe
                ? t("message.youRecalled") || "Bạn đã thu hồi tin nhắn"
                : t("message.recalled") || "Tin nhắn đã được thu hồi"}
            </span>
          </div>

          <div
            className={`text-xs text-gray-400 mt-1 px-1 ${
              isMe ? "text-right" : "text-left"
            }`}
          >
            {formatTime(message.recalledAt || message.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 🆕 NORMAL MESSAGE RENDER WITH AVATAR
  // ============================================
  return (
    <div
      id={`message-${messageId}`}
      className={`flex w-full ${
        isMe ? "justify-end" : "justify-start"
      } group relative transition-all duration-300 ${
        isHighlighted ? "animate-highlight" : ""
      }`}
    >
      <div
        className={`flex w-full ${
          isMe ? "flex-row-reverse" : "flex-row"
        } items-end gap-2 max-w-[85%] sm:max-w-[75%]`}
      >
        {/* 🆕 AVATAR - Only for other users on last message in group */}
        {!isMe && isLastInGroup && message.sender && (
          <div className="shrink-0 mb-1">
            <AvatarImage
              avatar={message.sender.avatar}
              nickname={message.sender.nickname || message.sender.fullName}
              avatarUpdatedAt={message.sender.avatarUpdatedAt}
              size="sm"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          </div>
        )}

        {/* 🆕 SPACER - Keep alignment when no avatar */}
        {!isMe && !isLastInGroup && (
          <div className="shrink-0 w-10" />
        )}

        {/* MESSAGE CONTENT */}
        <div
          className={`flex flex-col ${
            isMe ? "items-end" : "items-start"
          } flex-1 min-w-0`}
        >
          {/* Sender Info */}
          {senderInfo && <MessageSenderInfo {...senderInfo} />}

          {/* Message Bubble with Actions */}
          <div className="flex flex-col w-full">
            <div
              className={`flex items-end gap-1.5 ${
                isMe ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <MessageBubble
                messageText={messageText}
                isBig={isBig}
                isMe={isMe}
                isPending={isPending}
                isFailed={isFailed}
                isLastInGroup={isLastInGroup}
                editedAt={message.editedAt}
                replyTo={message.replyTo}
                onReplyClick={handleReplyClick}
                t={t}
                // Edit props
                isEditing={isEditing}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                editLoading={editLoading}
                message={message}
                conversationId={conversationId}
                onReactionClick={handleReactionClick}
                sender={message.sender} // 🆕 Pass sender for potential use
              />

              {/* Hide actions when editing */}
              {!isEditing && (
                <MessageActions
                  message={message}
                  conversationId={conversationId}
                  isMe={isMe}
                  isFailed={isFailed}
                  onReply={handleReply}
                  onCopy={handleCopy}
                  onEdit={handleEditClick}
                  onForward={handleForward}
                  isOneToOneChat={isPrivateChat}
                />
              )}
            </div>

            {/* REACTIONS DISPLAY (Outside bubble but aligned) */}
            {!isEditing && hasReactions && (
              <div className={`${isMe ? "self-end" : "self-start"}`}>
                <MessageReactions
                  reactions={reactions}
                  currentUserId={user?.uid}
                  onReactionClick={handleReactionClick}
                  isMe={isMe}
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {editError && (
            <div className="mt-2 text-xs text-red-500 px-1">{editError}</div>
          )}

          {/* Status + Read Receipts */}
          {!isEditing && (
            <MessageStatus
              time={formatTime(message.createdAt)}
              readStatus={readStatus}
              readUsers={readUsers}
              showReadReceipts={showReadReceipts}
              isFailed={isFailed}
              isMe={isMe}
              onRetry={handleRetry}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}