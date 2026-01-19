// frontend/src/user/utils/emoji.js
// Emoji regex for splitting only (no .test() with 'g' flag)
export const EMOJI_REGEX = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

// FIXED: Pure emoji checker (no global flag side effects)
export const isEmoji = (str) => {
  if (!str) return false;
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]$/u.test(str);
};

// Check if message contains only emojis
export const isEmojiOnly = (text) => {
  if (!text || typeof text !== 'string') return false; // ✅ Thêm check
  const emojiArray = text.match(EMOJI_REGEX) || [];
  const nonEmojiText = text.replace(EMOJI_REGEX, "").trim();
  return emojiArray.length > 0 && nonEmojiText === "";
};

// Check if emoji should be displayed in big size
export const isBigEmoji = (text) => {
  if (!text || typeof text !== 'string') return false; // ✅ Thêm check
  const emojiArray = text.match(EMOJI_REGEX) || [];
  const nonEmojiText = text.replace(EMOJI_REGEX, "").trim();
  const onlyEmojis = emojiArray.length > 0 && nonEmojiText === "";
  return onlyEmojis && emojiArray.length <= 3;
};