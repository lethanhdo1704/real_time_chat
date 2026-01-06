// frontend/src/user/components/Chat/ConversationItem.jsx
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
 * 🔥 UPDATED: Gray theme + RECALLED + EDITED MESSAGE PREVIEW + FIXED AVATAR RING
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
  // 🔥 FIX: Normalize conversation ID
  // ============================================
  const conversationId = conversation?.conversationId || conversation?._id;

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
        isOnline: friend.isOnline || friend.status === "online" || false,
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
  // FORMAT MESSAGE PREVIEW - WITH RECALLED + EDITED SUPPORT
  // ============================================

  const getMessagePreview = () => {
    // 🔥 DEBUG: Log everything
    console.log("🔍 [ConversationItem] getMessagePreview called:", {
      conversationId,
      hasLastMessage: !!lastMessage,
      isRecalled: lastMessage?.isRecalled,
      isEdited: !!lastMessage?.editedAt,
      content: lastMessage?.content,
      type: lastMessage?.type,
      editedAt: lastMessage?.editedAt,
    });

    if (!lastMessage) {
      return {
        text: t("messagePreview.startConversation") || "Start conversation",
        icon: null,
        isSpecial: false,
        isRecalled: false,
        isEdited: false,
      };
    }

    const isOwnMessage = lastMessage.sender?.uid === currentUserId;
    const senderName = isOwnMessage
      ? t("messagePreview.you") || "You"
      : lastMessage.sender?.nickname ||
        lastMessage.sender?.fullName ||
        t("messagePreview.friend") ||
        "Friend";

    // ============================================
    // 🔥 PRIORITY 1: CHECK RECALLED FIRST (HIGHEST PRIORITY)
    // ============================================
    console.log(
      "🔍 [ConversationItem] Checking isRecalled:",
      lastMessage.isRecalled
    );

    if (lastMessage.isRecalled) {
      console.log(
        "✅ [ConversationItem] Message IS recalled - returning recalled preview"
      );

      return {
        text: isOwnMessage
          ? t("messagePreview.youRecalled")
          : `${senderName} ${t("messagePreview.recalled")}`,
        icon: (
          <svg
            className="w-3.5 h-3.5 shrink-0"
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
        ),
        isSpecial: true,
        isRecalled: true,
        isEdited: false,
      };
    }

    // ============================================
    // 🆕 CHECK IF MESSAGE IS EDITED
    // ============================================
    const isEdited = !!lastMessage.editedAt;

    if (isEdited) {
      console.log(
        "✏️ [ConversationItem] Message is edited:",
        lastMessage.editedAt
      );
    }

    // ============================================
    // NORMAL MESSAGE TYPES (only if NOT recalled)
    // ============================================
    switch (lastMessage.type) {
      case "image":
        return {
          text: `${senderName}: ${t("messagePreview.photo") || "Photo"}${
            isEdited ? ` (${t("messagePreview.edited") || "edited"})` : ""
          }`,
          icon: "📷",
          isSpecial: true,
          isRecalled: false,
          isEdited,
        };
      case "file":
        return {
          text: `${senderName}: ${t("messagePreview.file") || "File"}${
            isEdited ? ` (${t("messagePreview.edited") || "edited"})` : ""
          }`,
          icon: "📎",
          isSpecial: true,
          isRecalled: false,
          isEdited,
        };
      case "video":
        return {
          text: `${senderName}: ${t("messagePreview.video") || "Video"}${
            isEdited ? ` (${t("messagePreview.edited") || "edited"})` : ""
          }`,
          icon: "🎥",
          isSpecial: true,
          isRecalled: false,
          isEdited,
        };
      case "audio":
        return {
          text: `${senderName}: ${t("messagePreview.audio") || "Audio"}${
            isEdited ? ` (${t("messagePreview.edited") || "edited"})` : ""
          }`,
          icon: "🎵",
          isSpecial: true,
          isRecalled: false,
          isEdited,
        };
      default:
        // Text message
        const content = lastMessage.content || "";

        // 🔥 Double-check: If no content, might be recalled
        if (!content && lastMessage.isRecalled) {
          return {
            text: isOwnMessage
              ? t("messagePreview.youRecalled") || "You recalled a message"
              : `${senderName} ${
                  t("messagePreview.recalled") || "recalled a message"
                }`,
            icon: "↩️",
            isSpecial: true,
            isRecalled: true,
            isEdited: false,
          };
        }

        // 🆕 IMPROVED: Calculate maxLength based on whether message is edited
        const editedIndicator = isEdited
          ? ` (${t("messagePreview.edited") || "edited"})`
          : "";
        const editedIndicatorLength = editedIndicator.length;

        // Reserve space for edited indicator
        const maxLength = 40 - (isEdited ? editedIndicatorLength : 0);
        const truncated =
          content.length > maxLength
            ? content.substring(0, maxLength) + "..."
            : content;

        return {
          text: isOwnMessage
            ? `${
                t("messagePreview.you") || "You"
              }: ${truncated}${editedIndicator}`
            : `${truncated}${editedIndicator}`,
          icon: null,
          isSpecial: false,
          isRecalled: false,
          isEdited,
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
    <div className="px-2 py-1">
      <button
        onClick={onClick}
        className={`
          group relative w-full flex items-center gap-3 p-3 rounded-lg
          transition-all duration-200 text-left
          ${
            isActive
              ? "bg-gray-200 shadow-md"
              : unreadCount > 0
              ? "bg-white hover:bg-gray-50 border border-gray-200"
              : "bg-white hover:bg-gray-50"
          }
        `}
      >
        {/* Avatar with Status */}
        <div className="relative shrink-0">
          <AvatarImage
            avatar={avatar}
            nickname={name}
            avatarUpdatedAt={avatarUpdatedAt}
            size="lg"
            showOnlineStatus={true}
            isOnline={isOnline}
            className={`
              transition-all
              ${
                isActive
                  ? "ring-2 ring-gray-400"
                  : unreadCount > 0
                  ? "ring-2 ring-blue-300"
                  : "ring-2 ring-gray-100 group-hover:ring-gray-200"
              }
              group-hover:scale-105
            `}
          />

          {/* Unread Badge on Avatar */}
          {unreadCount > 0 && (
            <span
              className={`
                absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1.5 
                text-[11px] font-bold flex items-center justify-center
                rounded-full border-2 border-white shadow-lg
                ${
                  isActive
                    ? "bg-gray-600 text-white"
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
                ${isActive ? "text-gray-900" : "text-gray-900"}
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
                      ? "text-gray-600"
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
              <span
                className={`shrink-0 ${
                  typeof messagePreview.icon === "string"
                    ? "text-sm"
                    : "text-gray-500"
                }`}
              >
                {messagePreview.icon}
              </span>
            )}
            <p
              className={`
                text-[13px] truncate flex-1 leading-tight
                ${
                  // 🔥 Special styling for recalled messages
                  messagePreview.isRecalled
                    ? "text-gray-500 italic"
                    : isActive
                    ? "text-gray-700 font-medium"
                    : unreadCount > 0
                    ? "text-gray-900 font-semibold"
                    : messagePreview.isSpecial
                    ? "text-gray-600 font-medium"
                    : "text-gray-500"
                }
                ${!lastMessage && !isActive ? "italic" : ""}
                ${
                  messagePreview.isEdited && !messagePreview.isRecalled
                    ? "text-gray-600"
                    : ""
                }
              `}
            >
              {messagePreview.text}
            </p>

            {/* Unread Indicator Dot */}
            {unreadCount > 0 && !isActive && (
              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-blue-600 animate-pulse"></div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
