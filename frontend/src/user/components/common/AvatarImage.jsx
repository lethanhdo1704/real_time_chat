// frontend/src/user/components/common/AvatarImage.jsx
import { useState } from "react";
import { getAvatarUrlWithCache, getUserInitials } from "../../utils/avatarUtils";

/**
 * AvatarImage – FINAL FIX
 * ✅ Absolutely no square background
 * ✅ Perfect circle on ANY background
 * ✅ Tailwind v4 safe
 * ✅ Production ready
 */
export default function AvatarImage({
  avatar,
  nickname,
  avatarUpdatedAt,
  className = "",
  size = "md",
  showOnlineStatus = false,
  isOnline = false,
  variant = "default" // "default" | "header"
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const avatarUrl = getAvatarUrlWithCache(avatar, avatarUpdatedAt);
  const initials = getUserInitials(nickname);

  const sizeClasses = {
    mini: "w-3.5 h-3.5 text-xs",
    xs: "w-8 h-8 text-xs",
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
    "2xl": "w-24 h-24 text-3xl",
    full: "w-full h-full aspect-square"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const shadowClass = variant === "header" ? "" : "shadow-sm";
  const hasImage = Boolean(avatarUrl) && !imageError;

  return (
    <div
      className={`
        relative inline-block
        rounded-full
        bg-white
        ${className}
      `}
    >
      {/* Avatar body */}
      <div
        className={`
          ${sizeClass}
          relative
          rounded-full
          overflow-hidden
          flex items-center justify-center
          text-white font-semibold
          ${shadowClass}
          ${
            hasImage
              ? "bg-transparent"
              : "bg-linear-to-br from-blue-400 to-purple-500"
          }
        `}
      >
        {/* Skeleton */}
        {hasImage && imageLoading && (
          <div className="absolute inset-0 rounded-full bg-gray-200 animate-pulse" />
        )}

        {/* Image */}
        {hasImage ? (
          <img
            src={avatarUrl}
            alt={nickname || "User"}
            className="w-full h-full object-cover rounded-full"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <span className="select-none leading-none">{initials}</span>
        )}
      </div>

      {/* Online status */}
      {showOnlineStatus && (
        <span
          className={`
            absolute bottom-0 right-0
            w-3.5 h-3.5
            rounded-full
            border-2 border-white
            ${isOnline ? "bg-green-400" : "bg-gray-400"}
          `}
        />
      )}
    </div>
  );
}
