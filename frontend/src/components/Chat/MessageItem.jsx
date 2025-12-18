// components/chat/MessageItem.jsx
import { useTranslation } from "react-i18next";
import { isBigEmoji } from "../../utils/emoji";
import { renderMessage } from "../../utils/renderMessage";

export default function MessageItem({
  message,
  isMe,
  isGroupChat,
  isPrivateChat,
}) {
  const { t } = useTranslation("chat");
  const isBig = isBigEmoji(message.text);

  return (
    // ✅ OUTER CONTAINER: MUST be w-full
    <div
      className={`flex w-full ${
        isMe ? "justify-end" : "justify-start"
      } animate-fadeIn`}
    >
      {/* ✅ ALIGN WRAPPER */}
      <div
        className={`flex flex-col max-w-full ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* ✅ MESSAGE BUBBLE */}
        <div
          className={`
            inline-block
            max-w-[75%]
            rounded-2xl
            px-4 py-2.5
            ${
              isMe
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
            }
          `}
        >
          {/* Sender name (group chat only) */}
          {!isMe && isGroupChat && (
            <p className="mb-1 text-xs font-medium text-blue-500 truncate">
              {message.senderName}
            </p>
          )}

          {/* Message text */}
          <p
            className={
              isBig
                ? "text-4xl leading-none"
                : "text-sm leading-[1.35] whitespace-pre-wrap"
            }
            style={
              isBig
                ? {}
                : {
                    overflowWrap: "break-word",
                    wordBreak: "normal",
                  }
            }
          >
            {renderMessage(message.text)}
          </p>
        </div>

        {/* Timestamp & status */}
        <div
          className={`mt-1 flex items-center gap-1 text-[11px] opacity-60 ${
            isMe ? "justify-end text-blue-600" : "justify-start text-gray-500"
          }`}
        >
          <span>
            {new Date(message.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {/* Status (private chat only) */}
          {isMe && isPrivateChat && (
            <span className="flex items-center gap-0.5">
              {message.read
                ? `✓✓ ${t("message.read")}`
                : `✓ ${t("message.sent")}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}