// frontend/src/components/Chat/ChatInput/BlockedBanner.jsx

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * BlockedBanner Component
 * Shows when user was kicked or left the group
 * 
 * @param {Object} props
 * @param {string} props.memberStatus - 'kicked' or 'left'
 * @param {Object} props.kickedBy - User who kicked (if kicked)
 * @param {string} props.kickedBy.uid
 * @param {string} props.kickedBy.nickname
 * @param {string} props.kickedBy.avatar
 * @param {string} props.kickedBy.kickedAt - Timestamp when kicked
 * @param {Function} props.t - Translation function
 */
const BlockedBanner = ({ memberStatus, kickedBy, t }) => {
  const isKicked = memberStatus === 'kicked';

  // Format kicked time
  const formatKickedTime = (kickedAt) => {
    if (!kickedAt) return null;
    
    try {
      const date = new Date(kickedAt);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: vi // Change based on your locale
      });
    } catch (error) {
      console.error('Error formatting kickedAt:', error);
      return null;
    }
  };

  const kickedTime = isKicked && kickedBy?.kickedAt 
    ? formatKickedTime(kickedBy.kickedAt) 
    : null;

  return (
    <div className="bg-white border-t border-gray-200 shrink-0">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className={`flex items-center gap-3 rounded-lg border p-4 ${
          isKicked 
            ? 'border-red-200 bg-red-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          {/* Icon */}
          <div className="shrink-0">
            {isKicked ? (
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isKicked ? (
              <>
                <p className={`text-sm font-medium ${
                  isKicked ? 'text-red-900' : 'text-gray-900'
                }`}>
                  {t("input.youWereKicked") || "Bạn đã bị kick khỏi nhóm"}
                </p>
                
                {kickedBy && (
                  <div className="mt-1 flex items-center gap-2">
                    {/* Kicked by avatar */}
                    {kickedBy.avatar && (
                      <img
                        src={kickedBy.avatar}
                        alt={kickedBy.nickname}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    )}
                    
                    <p className="text-sm text-red-700">
                      {t("input.kickedBy", { 
                        name: kickedBy.nickname 
                      }) || `Bởi ${kickedBy.nickname}`}
                      
                      {kickedTime && (
                        <span className="text-red-600 ml-1">
                          • {kickedTime}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {t("input.youLeftGroup") || "Bạn đã rời nhóm"}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {t("input.youLeftGroupDescription") || "Bạn không thể gửi tin nhắn trong nhóm này nữa."}
                </p>
              </>
            )}
          </div>

          {/* Optional: Rejoin button (if allowed) */}
          {/* Uncomment if you want to add rejoin functionality
          {!isKicked && (
            <div className="shrink-0">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {t("input.rejoinGroup") || "Tham gia lại"}
              </button>
            </div>
          )}
          */}
        </div>
      </div>
    </div>
  );
};

export default BlockedBanner;