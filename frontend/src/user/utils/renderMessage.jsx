// utils/renderMessage.jsx
import React from "react";
import LinkifyIt from "linkify-it";

const linkify = new LinkifyIt();

// Chỉ dùng cho TEXT thường
const softenLongUnbrokenText = (text, limit = 30) =>
  text.replace(new RegExp(`(\\S{${limit}})`, "g"), "$1\u200B");

export const renderMessage = (text = "") => {
  if (!text) return null;

  // ⚠️ QUAN TRỌNG: linkify trên text gốc
  const matches = linkify.match(text);

  // Không có link → soften toàn bộ
  if (!matches) {
    return (
      <span className="break-all whitespace-pre-wrap">
        {softenLongUnbrokenText(text)}
      </span>
    );
  }

  const elements = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    // ===== TEXT TRƯỚC LINK =====
    if (match.index > lastIndex) {
      const normalText = text.slice(lastIndex, match.index);
      elements.push(
        <span key={`text-${i}`} className="break-all whitespace-pre-wrap">
          {softenLongUnbrokenText(normalText)}
        </span>
      );
    }

    // ===== LINK (TUYỆT ĐỐI KHÔNG SOFTEN) =====
    elements.push(
      <a
        key={`link-${i}`}
        href={match.url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-blue-500 break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {match.text}
      </a>
    );

    lastIndex = match.lastIndex;
  });

  // ===== TEXT SAU LINK CUỐI =====
  if (lastIndex < text.length) {
    const tailText = text.slice(lastIndex);
    elements.push(
      <span key="text-end" className="break-all whitespace-pre-wrap">
        {softenLongUnbrokenText(tailText)}
      </span>
    );
  }

  return elements;
};
