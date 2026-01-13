// utils/renderMessage.jsx
import React from "react";

const VALID_TLDS = [
  'com','org','net','io','dev','vn','edu','gov','xyz','info','tech','me'
];

const softenLongUnbrokenText = (text, limit = 30) => {
  return text.replace(/(\S{30})/g, (match) => match + "\u200B");
};

const sanitizeLink = (url) => url.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

// Check if hostname is IP
const isIp = (hostname) => /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

// Check if hostname is domain with valid TLD
const isValidDomain = (hostname) => {
  const parts = hostname.split('.');
  if (parts.length < 2) return false; // at least 1 dot
  const tld = parts[parts.length - 1].toLowerCase();
  return VALID_TLDS.includes(tld);
};

// Normalize URL, return null if not valid link
const normalizeUrl = (text) => {
  const clean = sanitizeLink(text);
  let url = clean;
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (!(isIp(hostname) || isValidDomain(hostname))) return null;
    return parsed.href;
  } catch (err) {
    return null;
  }
};

export const renderMessage = (text) => {
  if (!text) return null;

  const safeText = softenLongUnbrokenText(text);

  const tokens = safeText.split(/(\s+)/);

  return tokens.map((token, i) => {
    const href = normalizeUrl(token);
    if (href) {
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-500 break-all whitespace-pre-wrap max-w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {token}
        </a>
      );
    }

    return (
      <span key={i} className="break-all whitespace-pre-wrap">
        {token}
      </span>
    );
  });
};
