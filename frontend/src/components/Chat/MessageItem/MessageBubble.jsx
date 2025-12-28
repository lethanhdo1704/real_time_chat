// frontend/src/components/Chat/MessageItem/MessageBubble.jsx
import { renderMessage } from "../../../utils/renderMessage";

export default function MessageBubble({
  messageText,
  isBig,
  isMe,
  isPending,
  isFailed,
  isLastInGroup,
  editedAt,
  t,
}) {
  const getBubbleCorner = () => {
    return isMe 
      ? (isLastInGroup ? "rounded-br-md" : "rounded-br-lg")
      : (isLastInGroup ? "rounded-bl-md" : "rounded-bl-lg");
  };

  const getBubbleColor = () => {
    if (!isMe) return "bg-white text-gray-800 shadow-sm hover:shadow-md border border-gray-100";
    if (isPending) return "bg-blue-400 text-white opacity-60";
    if (isFailed) return "bg-red-100 text-red-800 border border-red-300";
    return "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md";
  };

  return (
    <div className={`inline-flex flex-col rounded-2xl ${getBubbleCorner()} px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 ${getBubbleColor()}`}>
      <div className={isBig ? "text-4xl leading-none" : "text-[14px] sm:text-[15px] leading-[1.4] whitespace-pre-wrap "}>
        {renderMessage(messageText)}
      </div>
      
      {editedAt && (
        <span className={`text-[10px] mt-1 italic ${isMe ? "text-blue-100" : "text-gray-400"}`}>
          {t("message.edited") || "edited"}
        </span>
      )}
    </div>
  );
}