// frontend/src/utils/avatarUtils.js

function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;

  // ✅ Full URL (R2, backend, CDN, localhost, prod)
  if (
    avatarPath.startsWith("http://") ||
    avatarPath.startsWith("https://")
  ) {
    return avatarPath;
  }

  // ✅ Local path → gắn backend base URL
  const API_BASE = import.meta.env.VITE_API_URL;

  if (!API_BASE) {
    console.warn("VITE_API_URL is not defined");
    return avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
  }

  return `${API_BASE}${avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`}`;
}

function getAvatarUrlWithCache(avatarPath, avatarUpdatedAt) {
  const baseUrl = getAvatarUrl(avatarPath);
  if (!baseUrl) return null;

  // Cache busting cho R2 / CDN
  if (
    avatarUpdatedAt &&
    (baseUrl.includes(".r2.dev/") ||
      baseUrl.includes(".r2.cloudflarestorage.com/"))
  ) {
    const ts = new Date(avatarUpdatedAt).getTime();
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}t=${ts}`;
  }

  return baseUrl;
}

function getUserInitials(nickname) {
  if (!nickname) return "?";
  return nickname.trim()[0].toUpperCase();
}

function isR2Avatar(avatarPath) {
  if (!avatarPath) return false;
  return (
    avatarPath.includes(".r2.dev/") ||
    avatarPath.includes(".r2.cloudflarestorage.com/")
  );
}

export {
  getAvatarUrl,
  getAvatarUrlWithCache,
  getUserInitials,
  isR2Avatar,
};
