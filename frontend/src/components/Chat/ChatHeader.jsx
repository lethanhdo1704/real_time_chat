// frontend/src/components/Chat/ChatHeader.jsx
import { useTranslation } from "react-i18next";

/**
 * ChatHeader Component
 * 
 * ✅ Mobile: Back button on the left (Telegram-style)
 * ✅ Desktop: No back button
 * ✅ Consistent max-w-3xl with Body & Input
 */
export default function ChatHeader({ 
  receiverName, 
  receiverAvatar, 
  isTyping = false,
  typingUserName,
  isOnline = true,
  onCallClick,
  onVideoClick,
  onInfoClick,
  onBackClick,  // NEW: Back button handler
  showBackButton = false,  // NEW: Show back button on mobile
}) {
  const { t } = useTranslation("chat");

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
                className="md:hidden shrink-0 -ml-2 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-700 active:scale-95 transition-all"
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

            {/* Avatar with Status */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden ring-2 ring-gray-100">
                {receiverAvatar ? (
                  <img
                    src={receiverAvatar}
                    alt={receiverName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">
                    {receiverName?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>

              {/* Online Status Indicator */}
              {isOnline && !isTyping && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}

              {/* Typing Animation Indicator */}
              {isTyping && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full animate-pulse"></span>
              )}
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
                /* Online Status */
                <p className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
                  {isOnline ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                      {t("header.online") || "Online"}
                    </>
                  ) : (
                    t("header.offline") || "Offline"
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

            {/* Info Button */}
            <button
              onClick={onInfoClick}
              className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors group"
              title={t("header.info") || "Conversation info"}
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}