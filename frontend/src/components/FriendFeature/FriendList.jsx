// frontend/src/components/FriendFeature/FriendList.jsx
import { useEffect, useState } from "react";
import { getFriendsAndRequests } from "../../services/friendService";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";

export default function FriendList({
  currentUser,
  onSelectFriend,
  // Props to show chat status
  conversations = [],
  selectedConversation = null,
}) {
  const { t, i18n } = useTranslation("friendFeature");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const locale = i18n.language === 'vi' ? vi : enUS;

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriendsAndRequests();
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      fetchFriends();
    }
  }, [currentUser?.uid]);

  const handleSelectFriend = (friend) => {
    if (onSelectFriend) {
      onSelectFriend({
        uid: friend.uid,
        _id: friend._id,
        nickname: friend.nickname,
        avatar: friend.avatar,
      });
    }
  };

  /**
   * Get conversation info for a friend
   * Returns: { hasConversation, unreadCount, isActive, lastMessage, lastMessageAt }
   */
  const getConversationInfo = (friendUid) => {
    // Find conversation with this friend
    const conversation = conversations.find(conv => {
      if (conv.type === 'private' && conv.friend) {
        return conv.friend.uid === friendUid;
      }
      return false;
    });

    if (!conversation) {
      return { 
        hasConversation: false, 
        unreadCount: 0, 
        isActive: false,
        lastMessage: null,
        lastMessageAt: null,
      };
    }

    // Check if this conversation is currently selected
    const isActive = selectedConversation?.conversationId === conversation.conversationId ||
                     selectedConversation?._id === conversation._id;

    return {
      hasConversation: true,
      unreadCount: conversation.unreadCount || 0,
      isActive,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    };
  };

  /**
   * Format last message preview - Like Messenger
   */
  const formatLastMessage = (lastMessage, currentUserId) => {
    if (!lastMessage) return null;

    const isOwnMessage = lastMessage.sender?.uid === currentUserId;
    const senderName = isOwnMessage ? 'You' : (lastMessage.sender?.nickname || 'Friend');

    // Handle different message types
    switch (lastMessage.type) {
      case 'image':
        return {
          text: `${senderName}: 📷 Sent a photo`,
          icon: '📷',
          isSpecial: true
        };
      case 'file':
        return {
          text: `${senderName}: 📎 Sent a file`,
          icon: '📎',
          isSpecial: true
        };
      case 'video':
        return {
          text: `${senderName}: 🎥 Sent a video`,
          icon: '🎥',
          isSpecial: true
        };
      case 'audio':
        return {
          text: `${senderName}: 🎵 Sent a voice message`,
          icon: '🎵',
          isSpecial: true
        };
      default:
        const content = lastMessage.content || '';
        const maxLength = 40;
        const truncated = content.length > maxLength 
          ? content.substring(0, maxLength) + '...' 
          : content;
        return {
          text: isOwnMessage ? `You: ${truncated}` : truncated,
          icon: null,
          isSpecial: false
        };
    }
  };

  /**
   * Format timestamp - Like Messenger
   */
  const formatTimestamp = (date) => {
    if (!date) return '';
    try {
      const now = new Date();
      const messageDate = new Date(date);
      const diffInHours = (now - messageDate) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return formatDistanceToNow(messageDate, { 
          addSuffix: false, 
          locale 
        });
      } else {
        return formatDistanceToNow(messageDate, { 
          addSuffix: true, 
          locale 
        });
      }
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Sort friends: Unread first, then by recent message, then alphabetically
  const sortedFriends = [...friends].sort((a, b) => {
    const infoA = getConversationInfo(a.uid);
    const infoB = getConversationInfo(b.uid);

    // 1. Unread messages first (removed active check)
    if (infoA.unreadCount > 0 && infoB.unreadCount === 0) return -1;
    if (infoA.unreadCount === 0 && infoB.unreadCount > 0) return 1;

    // 2. Most recent conversation second
    if (infoA.lastMessageAt && infoB.lastMessageAt) {
      return new Date(infoB.lastMessageAt) - new Date(infoA.lastMessageAt);
    }
    if (infoA.lastMessageAt) return -1;
    if (infoB.lastMessageAt) return 1;

    // 3. Alphabetically last
    const nameA = a.nickname || a.uid || "";
    const nameB = b.nickname || b.uid || "";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="py-2 space-y-1.5">{/* ✅ Vertical padding only, no horizontal padding for full-width items */}
      {friends.length === 0 && (
        <div className="text-center py-8">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <p className="text-gray-500 text-sm">{t("friendList.empty.title")}</p>
          <p className="text-gray-400 text-xs mt-1">
            {t("friendList.empty.subtitle")}
          </p>
        </div>
      )}

      {sortedFriends.map((friend) => {
        const { hasConversation, unreadCount, isActive, lastMessage, lastMessageAt } = 
          getConversationInfo(friend.uid);

        const messagePreview = formatLastMessage(lastMessage, currentUser?.uid);
        const timestamp = formatTimestamp(lastMessageAt);

        return (
          <div
            key={friend._id}
            onClick={() => handleSelectFriend(friend)}
            className={`
              group relative flex items-center gap-3 p-3 rounded-none
              transition-all duration-200 cursor-pointer
              ${isActive 
                ? 'bg-linear-to-r from-blue-600 to-blue-500 border-l-4 border-l-white' 
                : unreadCount > 0
                ? 'bg-white hover:bg-blue-50 border-l-4 border-l-blue-400'
                : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'
              }
            `}
          >
            {/* Avatar with Status */}
            <div className="relative shrink-0">
              <img
                src={friend.avatar || "https://i.pravatar.cc/40"}
                alt={friend.nickname || friend.uid}
                className={`
                  w-14 h-14 rounded-full object-cover transition-all
                  ${isActive 
                    ? 'ring-4 ring-white shadow-xl' 
                    : unreadCount > 0 
                    ? 'ring-2 ring-blue-300' 
                    : 'ring-2 ring-gray-100 group-hover:ring-gray-200'
                  }
                `}
              />
              
              {/* Online Status Indicator */}
              <span className={`
                absolute bottom-0 right-0 w-4 h-4 rounded-full border-2
                ${isActive ? 'border-blue-600' : 'border-white'}
                ${isActive ? 'bg-white' : 'bg-green-500'}
              `}></span>
              
              {/* Unread Badge on Avatar - Facebook Style */}
              {unreadCount > 0 && !isActive && (
                <span className="absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1.5 
                               text-[11px] font-bold flex items-center justify-center
                               bg-red-500 text-white rounded-full border-2 border-white
                               shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
              {/* Name and Timestamp */}
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <h3 className={`
                  font-semibold truncate text-[15px]
                  ${isActive 
                    ? 'text-white' 
                    : 'text-gray-900'
                  }
                `}>
                  {friend.nickname || friend.uid}
                </h3>
                
                {/* Timestamp - Messenger Style */}
                {timestamp && (
                  <span className={`
                    text-[11px] font-medium shrink-0
                    ${isActive 
                      ? 'text-blue-100' 
                      : unreadCount > 0 
                      ? 'text-blue-600 font-semibold' 
                      : 'text-gray-400'
                    }
                  `}>
                    {timestamp}
                  </span>
                )}
              </div>

              {/* Message Preview - Messenger Style */}
              <div className="flex items-center gap-1.5">
                {messagePreview ? (
                  <>
                    {messagePreview.icon && (
                      <span className="text-sm shrink-0">{messagePreview.icon}</span>
                    )}
                    <p className={`
                      text-[13px] truncate flex-1 leading-tight
                      ${isActive
                        ? 'text-blue-100 font-medium'
                        : unreadCount > 0
                        ? 'text-gray-900 font-semibold'
                        : 'text-gray-500'
                      }
                      ${messagePreview.isSpecial && !isActive ? 'font-medium' : ''}
                    `}>
                      {messagePreview.text}
                    </p>
                  </>
                ) : (
                  <p className={`
                    text-[13px] italic flex-1 leading-tight
                    ${isActive ? 'text-blue-100' : 'text-gray-400'}
                  `}>
                    👋 Start a conversation
                  </p>
                )}

                {/* Unread Indicator Dot - Subtle */}
                {unreadCount > 0 && !isActive && (
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}