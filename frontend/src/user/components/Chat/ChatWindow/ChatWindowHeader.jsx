// frontend/src/user/components/Chat/ChatWindowsHeader.jsx
import { useTranslation } from "react-i18next";
import AvatarImage from "../../../components/common/AvatarImage";
import { useLastSeenFormat } from "../../../hooks/useLastSeenFormat";

/**
 * ChatHeader Component
 * 
 * ✅ Mobile: Back button on the left (Telegram-style)
 * ✅ Desktop: No back button
 * ✅ Consistent max-w-3xl with Body & Input
 * ✅ Uses AvatarImage component for consistency
 * ✅ Uses useLastSeenFormat hook for dynamic last seen
 * ✅ Fixed: lastSeen prop name mismatch
 * ✅ Fixed: Info button → Hamburger menu button
 */
export default function ChatHeader({ 
  receiverName, 
  receiverAvatar,
  receiverAvatarUpdatedAt,
  lastSeen,  // ✅ FIXED: Changed from receiverLastSeen to lastSeen
  isTyping = false,
  typingUserName,
  isOnline = false,
  onCallClick,
  onVideoClick,
  onInfoClick,  // Now used for hamburger menu
  onBackClick,
  showBackButton = false,
}) {
  const { t } = useTranslation("chat");
  const lastSeenText = useLastSeenFormat(lastSeen, isOnline);  // ✅ FIXED: Use lastSeen

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm shrink-0">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Back Button (Mobile) + Avatar & Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back Button - Mobile Only (Telegram Style) */}
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className="lg:hidden shrink-0 -ml-2 p-2 rounded-full hover:bg-gray-100 text-gray-700 active:scale-95 transition-all"
                style={{ 
                  minWidth: '40px',
                  minHeight: '40px',
                  WebkitTapHighlightColor: 'transparent'
                }}
                aria-label="Back to conversations"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* Avatar with Online Status using AvatarImage component */}
            <div className="shrink-0">
              <AvatarImage
                avatar={receiverAvatar}
                nickname={receiverName}
                avatarUpdatedAt={receiverAvatarUpdatedAt}
                size="md"
                showOnlineStatus={true}
                isOnline={isOnline}
                variant="header"
              />
            </div>

            {/* Name & Status */}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate text-base">
                {receiverName || "Unknown"}
              </h2>

              {/* Typing Indicator */}
              {isTyping ? (
                <div className="flex items-center gap-1.5 text-xs text-blue-500 italic animate-fadeIn">
                  <span className="inline-flex gap-0.5">
                    <span
                      className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </span>
                  <span>
                    {typingUserName 
                      ? `${typingUserName} ${t("header.isTyping") || "is typing"}`
                      : t("header.typing") || "typing..."
                    }
                  </span>
                </div>
              ) : (
                /* Online Status or Last Seen */
                <p className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
                  {isOnline ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                      {t("presence.online") || "Online"}
                    </>
                  ) : (
                    lastSeenText || t("header.offline") || "Offline"
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Voice Call Button */}
            <button
              onClick={onCallClick}
              className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors group"
              title={t("header.voiceCall") || "Voice call"}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </button>

            {/* Video Call Button */}
            <button
              onClick={onVideoClick}
              className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors group"
              title={t("header.videoCall") || "Video call"}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* Three Dots Menu Button (vertical) */}
            <button
              onClick={onInfoClick}
              className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors group"
              title={t("header.moreOptions") || "Menu"}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}