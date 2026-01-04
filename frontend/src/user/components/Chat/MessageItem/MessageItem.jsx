// frontend/src/user/components/Chat/MessageItem/MessageItem.jsx
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { isBigEmoji } from "../../../utils/emoji";
import MessageSenderInfo from "./MessageSenderInfo";
import MessageBubble from "./MessageBubble";
import MessageActions from "./MessageActions";
import MessageStatus from "./MessageStatus";
import useChatStore from "../../../store/chat/chatStore";

/**
 * MessageItem Component - WITH READ RECEIPTS (REACTIVE)
 *
 * ✅ Reply feature
 * ✅ Recalled message placeholder
 * ✅ Hide/Delete/Recall actions
 * ✅ Read receipts with avatars
 * ✅ 🆕 REACTIVE to readReceipts changes
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

  // Store actions
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const setHighlightedMessage = useChatStore(
    (state) => state.setHighlightedMessage
  );

  // 🔥 FIX: Subscribe to readReceipts for THIS conversation
  // This makes component re-render when receipts change
  const conversationReceipts = useChatStore(
    (state) => state.readReceipts?.get(conversationId)
  );

  // ============================================
  // MESSAGE DATA
  // ============================================
  const messageId = message.messageId || message._id;
  const isRecalled = message.isRecalled || false;
  const messageText = message.content || message.text || "";
  const isBig = !isRecalled && isBigEmoji(messageText);
  const isPending =
    message.status === "pending" || message._status === "sending";
  const isFailed = message.status === "failed" || message._status === "failed";

  // ============================================
  // 🆕 READ RECEIPTS LOGIC - REACTIVE FIX (F5-SAFE)
  // ============================================
  // 🔥 Lấy read receipts và filter bỏ sender của message
  const readUsers = conversationReceipts
    ? (conversationReceipts.get(messageId) || []).filter(
        u => u.userUid !== message.sender?.uid // Loại bỏ sender để không show avatar chính họ
      )
    : [];
  
  // 🔥 CHỈ show avatar read receipts cho tin nhắn của MÌNH
  // Tin nhắn người khác: KHÔNG show avatar
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
  // READ STATUS (for 1-1 chat status indicator)
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

    // 🆕 Check read receipts instead of old read field
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
      messageId: message.messageId || message._id,
      content: message.content,
      type: message.type || "text",
      sender: message.sender,
      createdAt: message.createdAt,
    };

    console.log("✅ Setting reply with prop conversationId:", conversationId);
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
  // OTHER HANDLERS
  // ============================================
  const handleEdit = () => {
    console.log("Edit message:", message._id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
  };

  const handleForward = () => {
    console.log("Forward message:", message._id);
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
  // 🔥 RECALLED MESSAGE RENDER
  // ============================================
  if (isRecalled) {
    return (
      <div
        id={`message-${messageId}`}
        className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group relative`}
      >
        <div
          className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}
        >
          {senderInfo && <MessageSenderInfo {...senderInfo} />}

          <div
            className={`inline-flex items-center gap-2 rounded-2xl ${isMe ? "rounded-br-md" : "rounded-bl-md"} px-4 py-2.5 bg-gray-100 text-gray-500 border border-gray-200`}
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
            className={`text-xs text-gray-400 mt-1 px-1 ${isMe ? "text-right" : "text-left"}`}
          >
            {formatTime(message.recalledAt || message.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // NORMAL MESSAGE RENDER
  // ============================================
  return (
    <div
      id={`message-${messageId}`}
      className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group relative transition-all duration-300 ${isHighlighted ? "animate-highlight" : ""}`}
    >
      <div
        className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}
      >
        {/* Sender Info */}
        {senderInfo && <MessageSenderInfo {...senderInfo} />}

        {/* Message Bubble with Actions */}
        <div
          className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
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
          />

          <MessageActions
            message={message}
            conversationId={conversationId}
            isMe={isMe}
            isFailed={isFailed}
            onReply={handleReply}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onForward={handleForward}
            isOneToOneChat={isPrivateChat}
          />
        </div>

        {/* Status + Read Receipts */}
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
      </div>
    </div>
  );
}