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

  // Format timestamp
  const formatTimestamp = (date) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale 
      });
    } catch {
      return '';
    }
  };

  // Format last message preview
  const getMessagePreview = () => {
    if (!lastMessage) return 'Start conversation...';
    
    if (lastMessageType === 'image') return '📷 Image';
    if (lastMessageType === 'file') return '📎 File';
    if (lastMessageType === 'video') return '🎥 Video';
    if (lastMessageType === 'audio') return '🎵 Audio';
    
    // Truncate text message
    return lastMessage.length > 50 
      ? lastMessage.substring(0, 50) + '...' 
      : lastMessage;
  };

  // Render menu item (friends, groups, requests, add)
  if (!isConversation) {
    return (
      <button
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
          transition-colors text-left
          ${active
            ? "bg-blue-100 text-blue-700"
            : "text-gray-700 hover:bg-gray-100"}
        `}
      >
        {icon}
        
        <span className="flex-1 text-sm font-medium">
          {label}
        </span>

        {badge > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 text-[11px] font-bold
                           flex items-center justify-center
                           bg-red-500 text-white rounded-full">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>
    );
  }

  // Render conversation item
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-lg
        transition-all text-left
        ${active
          ? "bg-blue-50 border-l-4 border-blue-500 shadow-sm"
          : "hover:bg-gray-100 border-l-4 border-transparent"}
      `}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={avatar || "https://i.pravatar.cc/40"}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 
                           text-[10px] font-bold flex items-center justify-center
                           bg-red-500 text-white rounded-full border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={`
            text-sm font-semibold truncate
            ${active ? "text-blue-700" : unreadCount > 0 ? "text-gray-900" : "text-gray-800"}
          `}>
            {name}
          </p>
          {timestamp && (
            <span className="text-[11px] text-gray-500 ml-2 shrink-0">
              {formatTimestamp(timestamp)}
            </span>
          )}
        </div>
        
        <p className={`
          text-xs truncate
          ${unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}
        `}>
          {getMessagePreview()}
        </p>
      </div>
    </button>
  );
}