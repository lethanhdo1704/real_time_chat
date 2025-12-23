// frontend/src/components/Home/SidebarItem.jsx
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export default function SidebarItem({ 
  icon, 
  label, 
  active, 
  onClick, 
  badge,
  // Props for conversation items
  isConversation,
  avatar,
  name,
  lastMessage,
  lastMessageType,
  timestamp,
  unreadCount,
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? vi : enUS;

  /**
   * Format timestamp - Messenger style
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

  /**
   * Get message preview with icon - Messenger style
   */
  const getMessagePreview = () => {
    if (!lastMessage) {
      return {
        text: '👋 Start a conversation',
        icon: null,
        isSpecial: false
      };
    }
    
    switch (lastMessageType) {
      case 'image':
        return {
          text: '📷 Sent a photo',
          icon: '📷',
          isSpecial: true
        };
      case 'file':
        return {
          text: '📎 Sent a file',
          icon: '📎',
          isSpecial: true
        };
      case 'video':
        return {
          text: '🎥 Sent a video',
          icon: '🎥',
          isSpecial: true
        };
      case 'audio':
        return {
          text: '🎵 Sent a voice message',
          icon: '🎵',
          isSpecial: true
        };
      default:
        const maxLength = 40;
        const truncated = lastMessage.length > maxLength 
          ? lastMessage.substring(0, maxLength) + '...' 
          : lastMessage;
        return {
          text: truncated,
          icon: null,
          isSpecial: false
        };
    }
  };

  // ============================================
  // RENDER MENU ITEM (Friends, Groups, etc.)
  // ============================================
  if (!isConversation) {
    return (
      <button
        onClick={onClick}
        className={`
          group w-full flex items-center gap-3 px-4 py-2.5 rounded-none
          transition-all duration-200 text-left
          ${active
            ? "bg-linear-to-r from-blue-600 to-blue-500 text-white border-l-4 border-l-white"
            : "text-gray-700 hover:bg-gray-100 border-l-4 border-l-transparent"}
        `}
      >
        <div className={`
          shrink-0 transition-transform
          ${active ? 'scale-110' : 'group-hover:scale-105'}
        `}>
          {icon}
        </div>
        
        <span className={`
          flex-1 text-sm font-semibold
          ${active ? 'text-white' : 'text-gray-800'}
        `}>
          {label}
        </span>

        {/* Badge - Messenger style */}
        {badge > 0 && (
          <span className={`
            min-w-5.5 h-5.5 px-1.5 text-[11px] font-bold
            flex items-center justify-center rounded-full
            ${active 
              ? 'bg-white text-blue-600' 
              : 'bg-red-500 text-white animate-pulse'
            }
          `}>
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>
    );
  }

  // ============================================
  // RENDER CONVERSATION ITEM - Messenger Style
  // ============================================
  const messagePreview = getMessagePreview();
  const formattedTime = formatTimestamp(timestamp);

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full flex items-center gap-3 p-3 rounded-none
        transition-all duration-200 text-left
        ${active 
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
          src={avatar || "https://i.pravatar.cc/40"}
          alt={name}
          className={`
            w-14 h-14 rounded-full object-cover transition-all
            ${active 
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
          ${active ? 'border-blue-600 bg-white' : 'border-white bg-green-500'}
        `}></span>
        
        {/* Unread Badge on Avatar */}
        {unreadCount > 0 && !active && (
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
            ${active ? 'text-white' : 'text-gray-900'}
          `}>
            {name}
          </h3>
          
          {/* Timestamp */}
          {formattedTime && (
            <span className={`
              text-[11px] font-medium shrink-0
              ${active 
                ? 'text-blue-100' 
                : unreadCount > 0 
                ? 'text-blue-600 font-semibold' 
                : 'text-gray-400'
              }
            `}>
              {formattedTime}
            </span>
          )}
        </div>

        {/* Message Preview */}
        <div className="flex items-center gap-1.5">
          {messagePreview.icon && (
            <span className="text-sm shrink-0">{messagePreview.icon}</span>
          )}
          <p className={`
            text-[13px] truncate flex-1 leading-tight
            ${active
              ? 'text-blue-100 font-medium'
              : unreadCount > 0
              ? 'text-gray-900 font-semibold'
              : messagePreview.isSpecial
              ? 'text-gray-600 font-medium'
              : 'text-gray-500'
            }
            ${!lastMessage && !active ? 'italic' : ''}
          `}>
            {messagePreview.text}
          </p>

          {/* Unread Indicator Dot */}
          {unreadCount > 0 && !active && (
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 animate-pulse"></div>
          )}
        </div>
      </div>
    </button>
  );
}