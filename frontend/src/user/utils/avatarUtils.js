// frontend/src/utils/avatarUtils.js

/**
 * Get avatar URL - supports both R2 and local paths
 * @param {string} avatarPath - Can be R2 URL or local path
 * @returns {string|null} - Final URL to use
 */
function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;

  // ✅ R2 URL - sử dụng trực tiếp (full URL từ backend)
  if (avatarPath.startsWith("https://pub-") || 
      avatarPath.startsWith("http://pub-") ||
      avatarPath.includes(".r2.dev/") ||
      avatarPath.includes(".r2.cloudflarestorage.com/")) {
    return avatarPath;
  }

  // ✅ Legacy full URL (http://localhost:5000/...) → convert về path
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    try {
      const url = new URL(avatarPath);
      return url.pathname + url.search;
    } catch {
      return avatarPath; // Fallback nếu URL invalid
    }
  }

  // ✅ Local path - đảm bảo luôn bắt đầu với /
  return avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
}

/**
 * Get avatar URL with cache busting timestamp
 * @param {string} avatarPath - Avatar path or URL
 * @param {string|Date} avatarUpdatedAt - Timestamp for cache busting
 * @returns {string|null} - URL with cache parameter
 */
function getAvatarUrlWithCache(avatarPath, avatarUpdatedAt) {
  const baseUrl = getAvatarUrl(avatarPath);
  if (!baseUrl) return null;

  // ✅ Chỉ thêm cache busting cho R2 URLs (vì R2 có cache lâu)
  if (avatarUpdatedAt && (
    baseUrl.includes(".r2.dev/") || 
    baseUrl.includes(".r2.cloudflarestorage.com/")
  )) {
    const ts = new Date(avatarUpdatedAt).getTime();
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}t=${ts}`;
  }

  return baseUrl;
}

/**
 * Get user initials from nickname
 * @param {string} nickname - User's nickname
 * @returns {string} - First letter uppercase or "?"
 */
function getUserInitials(nickname) {
  if (!nickname) return "?";
  return nickname.trim()[0].toUpperCase();
}

/**
 * Check if avatar is from R2 storage
 * @param {string} avatarPath - Avatar path or URL
 * @returns {boolean}
 */
function isR2Avatar(avatarPath) {
  if (!avatarPath) return false;
  return avatarPath.includes(".r2.dev/") || 
         avatarPath.includes(".r2.cloudflarestorage.com/");
}

export { 
  getAvatarUrl, 
  getAvatarUrlWithCache, 
  getUserInitials,
  isR2Avatar 
};