// frontend/src/components/common/AvatarImage.jsx
import { useState } from "react";
import { getAvatarUrlWithCache, getUserInitials } from "../../utils/avatarUtils";

/**
 * Reusable Avatar Component
 * Handles:
 * - Avatar URL generation with cache busting
 * - Fallback to initials
 * - Error handling
 * - Loading state
 * 
 * @param {string} avatar - Avatar path from API
 * @param {string} nickname - User nickname for initials
 * @param {Date|string} avatarUpdatedAt - Last update timestamp
 * @param {string} className - Additional CSS classes
 * @param {string} size - Size variant (sm, md, lg, xl)
 */
export default function AvatarImage({ 
  avatar, 
  nickname, 
  avatarUpdatedAt,
  className = "",
  size = "md",
  showOnlineStatus = false,
  isOnline = false
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
    "2xl": "w-24 h-24 text-3xl"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const handleImageError = (e) => {
    console.error("❌ [Avatar] Failed to load:", avatarUrl);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`${sizeClass} rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden shadow-lg`}
      >
        {avatarUrl && !imageError ? (
          <>
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            
            {/* Avatar image */}
            <img
              src={avatarUrl}
              alt={nickname || 'User'}
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        ) : (
          // Fallback to initials
          <span className="select-none">{initials}</span>
        )}
      </div>

      {/* Online status indicator */}
      {showOnlineStatus && (
        <span 
          className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
            isOnline ? 'bg-green-400' : 'bg-gray-400'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}