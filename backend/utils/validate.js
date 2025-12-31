// backend/utils/validate.js
export const isValidEmail = (email) => {
  if (typeof email !== "string") return false;

  const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return regex.test(email.trim());
};

// Password: ≥ 6 ký tự, có chữ + số
export const isValidPassword = (password) => {
  if (typeof password !== "string") return false;

  if (password.length < 6) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;

  return true;
};

/**
 * Normalize nickname: trim, collapse multiple spaces
 */
export const normalizeNickname = (nickname) => {
  if (typeof nickname !== "string") return "";
  return nickname.trim().replace(/\s+/g, " ");
};

/**
 * Validate nickname (3-32 chars, allow Unicode + emoji)
 */
export const isValidNickname = (nickname) => {
  if (typeof nickname !== "string") return false;

  const name = normalizeNickname(nickname);

  // Check length
  if (name.length < 3 || name.length > 32) return false;

  // Must have at least 1 visible character (not just spaces/emoji)
  if (!/[\p{L}\p{N}]/u.test(name)) return false;

  return true;
};