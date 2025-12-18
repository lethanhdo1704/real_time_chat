// utils/renderMessage.jsx

import { EMOJI_REGEX } from "./emoji";

// Regex KHÔNG có flag g cho test
const URL_DETECT_REGEX = /^https?:\/\/\S+$/;
const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/g;

// Chỉ soften chuỗi KHÔNG có space quá dài
const softenLongUnbrokenText = (text, limit = 30) => {
  return text.replace(
    new RegExp(`(\\S{${limit}})`, "g"),
    "$1\u200B"
  );
};

export const renderMessage = (text) => {
  if (!text) return null;

  // ⭐ RẤT QUAN TRỌNG
  const safeText = softenLongUnbrokenText(text);

  const parts = safeText.split(URL_SPLIT_REGEX);

  return parts.map((part, index) => {
    if (URL_DETECT_REGEX.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-200 break-words"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
};
