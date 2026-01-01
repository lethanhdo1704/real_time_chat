// frontend/src/components/Chat/MessageItem/MessageItem.jsx
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { isBigEmoji } from "../../../utils/emoji";
import MessageSenderInfo from "./MessageSenderInfo";
import MessageBubble from "./MessageBubble";
import MessageActions from "./MessageActions";
import MessageStatus from "./MessageStatus";
import useChatStore from "../../../store/chat/chatStore";

/**
 * MessageItem Component - With Reply Feature
 * 
 * ✅ FIXED: Receive conversationId from props (not from store)
 * ✅ Reply button in actions menu
 * ✅ Set replyingTo in store
 * ✅ Pass replyTo data to bubble
 * ✅ Scroll to replied message on click
 */
export default function MessageItem({
  message,
  conversationId, // ✅ RECEIVE AS PROP
  isMe,
  isGroupChat,
  isPrivateChat,
  showSender = false,
  isLastInGroup = true,
  onRetryMessage,
  isHighlighted = false,
}) {
  const { t } = useTranslation("chat");

  // ============================================
  // 🔥 STORE ACTIONS (NO LONGER READ activeConversation)
  // ============================================
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const setHighlightedMessage = useChatStore((state) => state.setHighlightedMessage);

  // ❌ REMOVED: const activeConversation = useChatStore(...)
  // ❌ REMOVED: const conversationId = activeConversation?._id || ...

  // ============================================
  // MESSAGE DATA
  // ============================================
  const messageText = message.content || message.text || "";
  const isBig = isBigEmoji(messageText);
  const isPending = message.status === "pending" || message._status === "sending";
  const isFailed = message.status === "failed" || message._status === "failed";

  // ============================================
  // SENDER INFO
  // ============================================
  const senderInfo = !showSender || isMe ? null : {
    name: message.sender?.nickname || message.sender?.fullName || "Unknown",
    avatar: message.sender?.avatar,
  };

  // ============================================
  // READ STATUS
  // ============================================
  const getReadStatus = () => {
    if (!isMe || !isPrivateChat) return null;

    if (isFailed) {
      return { icon: "⚠️", text: t("message.failed") || "Failed", color: "text-red-500" };
    }
    if (isPending) {
      return { icon: "⏱", text: t("message.sending") || "Sending...", color: "text-gray-400" };
    }
    if (message.read || message.readBy?.length > 0) {
      return { icon: "✓✓", text: t("message.read") || "Read", color: "text-blue-500" };
    }
    return { icon: "✓", text: t("message.sent") || "Sent", color: "text-gray-400" };
  };

  const readStatus = getReadStatus();

  // ============================================
  // 🔥 REPLY HANDLERS (NOW USES PROP conversationId)
  // ============================================
  const handleReply = () => {
    if (!conversationId) {
      console.error("❌ No conversationId provided to MessageItem");
      return;
    }

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

  const handleDelete = () => {
    console.log("Delete message:", message._id);
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
  // RENDER
  // ============================================
  return (
    <div 
      id={`message-${message.messageId || message._id}`}
      className={`
        flex w-full ${isMe ? "justify-end" : "justify-start"} 
        group relative transition-all duration-300
        ${isHighlighted ? 'animate-highlight' : ''}
      `}
    >
      <div className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
        
        {/* Sender Info */}
        {senderInfo && <MessageSenderInfo {...senderInfo} />}

        {/* Message Bubble with Actions */}
        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
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
            isMe={isMe}
            isFailed={isFailed}
            onReply={handleReply}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onForward={handleForward}
          />
        </div>

        {/* Status */}
        <MessageStatus
          time={formatTime(message.createdAt)}
          readStatus={readStatus}
          isFailed={isFailed}
          isMe={isMe}
          onRetry={handleRetry}
          t={t}
        />
      </div>
    </div>
  );
}