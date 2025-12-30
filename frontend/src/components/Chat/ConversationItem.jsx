// frontend/src/components/Chat/ConversationItem.jsx
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import AvatarImage from "../common/AvatarImage";

/**
 * ConversationItem Component
 * 
 * Displays a conversation in the sidebar
 * Works for both friends and groups
 * Shows: avatar, name, lastMessage, unreadCount, timestamp
 * 🔥 UPDATED: Using AvatarImage component for consistent rendering
 */
export default function ConversationItem({
  conversation,
  friend, // For private chats with friends
  isActive,
  currentUserId,
  onClick,
}) {
  const { t, i18n } = useTranslation("friendFeature");
  const locale = i18n.language === "vi" ? vi : enUS;

  // ============================================
  // GET DISPLAY INFO
  // ============================================

  const getDisplayInfo = () => {
    if (conversation?.type === "group") {
      return {
        avatar: conversation.avatar || null,
        name: conversation.name || "Group Chat",
        avatarUpdatedAt: conversation.avatarUpdatedAt,
        isOnline: true, // Groups are always "online"
      };
    }

    // Private chat - use friend info
    if (friend) {
      return {
        avatar: friend.avatar || null,
        name: friend.nickname || friend.uid,
        avatarUpdatedAt: friend.avatarUpdatedAt,
        isOnline: friend.isOnline || friend.status === 'online' || false,
      };
    }

    // Fallback
    return {
      avatar: null,
      name: "Unknown",
      avatarUpdatedAt: null,
      isOnline: false,
    };
  };

  const { avatar, name, avatarUpdatedAt, isOnline } = getDisplayInfo();
  const unreadCount = conversation?.unreadCount || 0;
  const lastMessage = conversation?.lastMessage;
  const lastMessageAt = conversation?.lastMessageAt;

  // ============================================
  // FORMAT MESSAGE PREVIEW
  // ============================================

  const getMessagePreview = () => {
    if (!lastMessage) {
      return {
        text: t("messagePreview.startConversation") || "👋 Start a conversation",
        icon: null,
        isSpecial: false,
      };
    }

    const isOwnMessage = lastMessage.sender?.uid === currentUserId;
    const senderName = isOwnMessage
      ? t("messagePreview.you") || "You"
      : lastMessage.sender?.nickname || lastMessage.sender?.fullName || t("messagePreview.friend") || "Friend";

    switch (lastMessage.type) {
      case "image":
        return {
          text: `${senderName}: ${t("messagePreview.photo") || "Photo"}`,
          icon: "📷",
          isSpecial: true,
        };
      case "file":
        return {
          text: `${senderName}: ${t("messagePreview.file") || "File"}`,
          icon: "📎",
          isSpecial: true,
        };
      case "video":
        return {
          text: `${senderName}: ${t("messagePreview.video") || "Video"}`,
          icon: "🎥",
          isSpecial: true,
        };
      case "audio":
        return {
          text: `${senderName}: ${t("messagePreview.audio") || "Voice"}`,
          icon: "🎵",
          isSpecial: true,
        };
      default:
        const content = lastMessage.content || "";
        const maxLength = 40;
        const truncated =
          content.length > maxLength
            ? content.substring(0, maxLength) + "..."
            : content;
        return {
          text: isOwnMessage
            ? `${t("messagePreview.you") || "You"}: ${truncated}`
            : truncated,
          icon: null,
          isSpecial: false,
        };
    }
  };

  const messagePreview = getMessagePreview();

  // ============================================
  // FORMAT TIMESTAMP
  // ============================================

  const formatTimestamp = (date) => {
    if (!date) return "";
    try {
      const now = new Date();
      const messageDate = new Date(date);
      const diffInHours = (now - messageDate) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return formatDistanceToNow(messageDate, {
          addSuffix: false,
          locale,
        });
      } else {
        return formatDistanceToNow(messageDate, {
          addSuffix: true,
          locale,
        });
      }
    } catch {
      return "";
    }
  };

  const timestamp = formatTimestamp(lastMessageAt);

  // ============================================
  // RENDER
  // ============================================

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full flex items-center gap-3 p-3 rounded-none
        transition-all duration-200 text-left
        ${
          isActive
            ? "bg-linear-to-r from-blue-600 to-blue-500 border-l-4 border-l-white"
            : unreadCount > 0
            ? "bg-white hover:bg-blue-50 border-l-4 border-l-blue-400"
            : "bg-white hover:bg-gray-50 border-l-4 border-l-transparent"
        }
      `}
    >
      {/* Avatar with Status - Using AvatarImage Component */}
      <div className="relative shrink-0">
        <div
          className={`
            transition-all
            ${
              isActive
                ? "ring-4 ring-white shadow-xl"
                : unreadCount > 0
                ? "ring-2 ring-blue-300"
                : "ring-2 ring-gray-100 group-hover:ring-gray-200"
            }
            rounded-full
          `}
        >
          <AvatarImage
            avatar={avatar}
            nickname={name}
            avatarUpdatedAt={avatarUpdatedAt}
            size="lg"
            showOnlineStatus={true}
            isOnline={isOnline}
            className="transition-transform group-hover:scale-105"
          />
        </div>

        {/* Unread Badge on Avatar */}
        {unreadCount > 0 && (
          <span
            className={`
            absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1.5 
            text-[11px] font-bold flex items-center justify-center
            rounded-full border-2 border-white shadow-lg
            ${
              isActive
                ? "bg-white text-blue-600"
                : "bg-red-500 text-white animate-pulse"
            }
          `}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {/* Info Section */}
      <div className="flex-1 min-w-0">
        {/* Name and Timestamp */}
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <h3
            className={`
            font-semibold truncate text-[15px]
            ${isActive ? "text-white" : "text-gray-900"}
          `}
          >
            {name}
          </h3>

          {/* Timestamp */}
          {timestamp && (
            <span
              className={`
              text-[11px] font-medium shrink-0
              ${
                isActive
                  ? "text-blue-100"
                  : unreadCount > 0
                  ? "text-blue-600 font-semibold"
                  : "text-gray-400"
              }
            `}
            >
              {timestamp}
            </span>
          )}
        </div>

        {/* Message Preview */}
        <div className="flex items-center gap-1.5">
          {messagePreview.icon && (
            <span className="text-sm shrink-0">{messagePreview.icon}</span>
          )}
          <p
            className={`
            text-[13px] truncate flex-1 leading-tight
            ${
              isActive
                ? "text-blue-100 font-medium"
                : unreadCount > 0
                ? "text-gray-900 font-semibold"
                : messagePreview.isSpecial
                ? "text-gray-600 font-medium"
                : "text-gray-500"
            }
            ${!lastMessage && !isActive ? "italic" : ""}
          `}
          >
            {messagePreview.text}
          </p>

          {/* Unread Indicator Dot */}
          {unreadCount > 0 && (
            <div
              className={`
              w-2.5 h-2.5 rounded-full shrink-0
              ${isActive ? "bg-white" : "bg-blue-600 animate-pulse"}
            `}
            ></div>
          )}
        </div>
      </div>
    </button>
  );
}