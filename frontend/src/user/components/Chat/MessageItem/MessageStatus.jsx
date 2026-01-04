// frontend/src/user/components/Chat/MessageItem/MessageStatus.jsx
import AvatarImage from "../../common/AvatarImage";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * MessageStatus Component - WITH READ RECEIPTS (CLEAN VERSION)
 * 
 * Displays:
 * - Timestamp
 * - Read status indicator (text only, no icons)
 * - 🆕 Read receipts avatars inline with timestamp tooltip
 * - Retry button (for failed messages)
 */
export default function MessageStatus({ 
  time, 
  readStatus, 
  readUsers = [],
  showReadReceipts = false,
  isFailed, 
  isMe, 
  onRetry, 
  t 
}) {
  // Format timestamp for tooltip
  const formatTimestamp = (isoString) => {
    try {
      return format(new Date(isoString), "HH:mm, dd/MM/yyyy", { locale: vi });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`mt-1 px-1 ${isMe ? "text-right" : "text-left"}`}>
      
      {/* Single Row: Time + Status + Avatars */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="text-gray-400">{time}</span>
        
        {readStatus && (
          <span className={`flex items-center gap-0.5 ${readStatus.color}`}>
            <span className="text-xs">{readStatus.text}</span>
          </span>
        )}

        {/* 🆕 Read Receipts Avatars - Inline with Timestamp Tooltip */}
        {showReadReceipts && readUsers.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {readUsers.map((user, index) => (
              <div
                key={user.userUid}
                className="relative inline-block"
                style={{
                  zIndex: readUsers.length - index,
                }}
                title={`${user.nickname} đã xem${user.readAt ? ` lúc ${formatTimestamp(user.readAt)}` : ''}`}
              >
                <AvatarImage
                  avatar={user.avatar}
                  nickname={user.nickname}
                  size="mini"
                  variant="header"
                  className="ring-[0.5px] ring-white"
                />
              </div>
            ))}
          </div>
        )}
        
        {isFailed && (
          <button
            className="ml-1 text-red-500 hover:text-red-700 underline text-[10px] font-medium active:scale-95"
            onClick={onRetry}
          >
            {t("message.retry") || "Retry"}
          </button>
        )}
      </div>
    </div>
  );
}