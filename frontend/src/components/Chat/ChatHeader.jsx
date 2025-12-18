// components/chat/ChatHeader.jsx
import { useTranslation } from "react-i18next";

export default function ChatHeader({ receiverName, receiverAvatar, isTyping }) {
  const { t } = useTranslation("chat");

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden shrink-0">
          {receiverAvatar ? (
            <img
              src={receiverAvatar}
              alt={receiverName}
              className="w-full h-full object-cover"
            />
          ) : (
            receiverName?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-gray-800 truncate">
            {receiverName}
          </h2>
          {isTyping ? (
            <p className="text-xs text-blue-500 italic flex items-center gap-1">
              <span className="inline-flex gap-0.5">
                <span
                  className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </span>
              {t("header.typing")}
            </p>
          ) : (
            <p className="text-xs text-green-500">● {t("header.online")}</p>
          )}
        </div>
      </div>
    </div>
  );
}