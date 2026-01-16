// frontend/src/components/Chat/ChatInput/ReplyPreview.jsx
import React from 'react';

export default function ReplyPreview({ replyingTo, onClear, truncateText, t }) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 animate-in slide-in-from-bottom-2 duration-200">
      <svg
        className="h-4 w-4 shrink-0 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700">
          {t("input.replyingTo")} {replyingTo.sender?.nickname || t("message.unknownSender")}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {truncateText(replyingTo.content, 60)}
        </p>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
        title={t("input.cancelReply")}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}