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

// Nickname: 2–20 ký tự
export const isValidNickname = (nickname) => {
  if (typeof nickname !== "string") return false;

  const name = nickname.trim();
  if (name.length < 2 || name.length > 20) return false;

  return true;
};
