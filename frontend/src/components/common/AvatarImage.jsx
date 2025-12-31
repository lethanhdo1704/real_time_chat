// frontend/src/components/common/AvatarImage.jsx
import { useState } from "react";
import { getAvatarUrlWithCache, getUserInitials } from "../../utils/avatarUtils";

/**
 * Avatar Component - Production Ready
 * 
 * ✅ No shadow in header (Telegram/Messenger style)
 * ✅ No anti-aliasing artifacts
 * ✅ Clean & Professional
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

  // Size classes
  const sizeClasses = {
    xs: "w-8 h-8 text-xs",
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
    "2xl": "w-24 h-24 text-3xl",
    full: "w-full h-full" // ✅ THÊM SIZE FULL
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Shadow based on variant - NO shadow in header
  const shadowClass = variant === "header" ? "" : "shadow-sm";

  const handleImageError = (e) => {
    console.error("❌ [Avatar] Failed to load:", avatarUrl);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Check if we have a valid image
  const hasImage = avatarUrl && !imageError;

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          ${sizeClass} 
          rounded-full 
          flex items-center justify-center 
          text-white font-semibold 
          overflow-hidden
          ${shadowClass}
          ${hasImage 
            ? "bg-transparent" 
            : "bg-linear-to-br from-blue-400 to-purple-500"
          }
        `}
      >
        {hasImage ? (
          <>
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
            )}
            
            {/* Avatar image */}
            <img
              src={avatarUrl}
              alt={nickname || 'User'}
              className="w-full h-full object-cover rounded-full"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        ) : (
          // Fallback to initials with gradient
          <span className="select-none">{initials}</span>
        )}
      </div>

      {/* Online status indicator */}
      {showOnlineStatus && (
        <span 
          className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${
            isOnline ? 'bg-green-400' : 'bg-gray-400'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}