// frontend/src/components/Chat/MessageItem/MessageStatus.jsx

export default function MessageStatus({ time, readStatus, isFailed, isMe, onRetry, t }) {
  return (
    <div className={`mt-1 flex items-center gap-1.5 text-[11px] px-1 ${isMe ? "justify-end" : "justify-start"}`}>
      <span className="text-gray-400">{time}</span>
      
      {readStatus && (
        <span className={`flex items-center gap-0.5 ${readStatus.color}`}>
          <span className="text-xs">{readStatus.icon}</span>
        </span>
      )}
      
      {isFailed && (
        <button
          className="ml-1 text-red-500 hover:text-red-700 underline text-[10px] font-medium active:scale-95"
          onClick={onRetry}
        >
          {t("message.retry") || "Retry"}
        </button>
      )}
    </div>
  );
}