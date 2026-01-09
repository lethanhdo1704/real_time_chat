// frontend/src/utils/avatarUtils.js

function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;

  // Nếu backend trả full URL (legacy) → convert về path
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    const url = new URL(avatarPath);
    return url.pathname + url.search;
  }

  // Đảm bảo luôn là path tương đối
  return avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
}

function getAvatarUrlWithCache(avatarPath, avatarUpdatedAt) {
  const basePath = getAvatarUrl(avatarPath);
  if (!basePath) return null;

  if (avatarUpdatedAt) {
    const ts = new Date(avatarUpdatedAt).getTime();
    return `${basePath}?t=${ts}`;
  }

  return basePath;
}

function getUserInitials(nickname) {
  if (!nickname) return "?";
  return nickname.trim()[0].toUpperCase();
}

export { getAvatarUrl, getAvatarUrlWithCache, getUserInitials };
