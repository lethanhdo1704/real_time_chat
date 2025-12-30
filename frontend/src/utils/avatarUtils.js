// frontend/src/utils/avatarUtils.js
/**
 * Get full avatar URL
 * Handles both relative paths and full URLs
 * 
 * @param {string|null|undefined} avatarPath - Avatar path from API
 * @returns {string|null} Full URL or null
 */
function getAvatarUrl(avatarPath) {
  if (!avatarPath) {
    return null;
  }

  // Already a full URL (http:// or https://)
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // Relative path - prepend API base URL
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  // Remove '/api' from base URL to get server root
  const SERVER_ROOT = API_BASE.replace('/api', '');
  
  // Ensure path starts with /
  const cleanPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  
  return `${SERVER_ROOT}${cleanPath}`;
}

/**
 * Get avatar URL with cache busting
 * Adds timestamp to prevent browser caching old avatars
 * 
 * @param {string|null|undefined} avatarPath - Avatar path from API
 * @param {Date|string|number|null} avatarUpdatedAt - Last update timestamp
 * @returns {string|null} Full URL with cache buster or null
 */
function getAvatarUrlWithCache(avatarPath, avatarUpdatedAt) {
  const baseUrl = getAvatarUrl(avatarPath);
  
  if (!baseUrl) {
    return null;
  }

  // Add cache buster if we have update timestamp
  if (avatarUpdatedAt) {
    const timestamp = new Date(avatarUpdatedAt).getTime();
    return `${baseUrl}?t=${timestamp}`;
  }

  return baseUrl;
}

/**
 * Get user initials from nickname
 * 
 * @param {string} nickname - User nickname
 * @returns {string} First letter uppercase
 */
function getUserInitials(nickname) {
  if (!nickname) return "?";
  return nickname.trim()[0].toUpperCase();
}

// Export all functions
export { getAvatarUrl, getAvatarUrlWithCache, getUserInitials };