// frontend/src/components/Chat/ChatWindow/ChatWindowBody.jsx

import MessageList from "../MessageList";

/**
 * ChatWindowBody Component
 * 
 * ✅ FIXED: Scrollbar alignment với scrollbar-gutter: stable
 * ✅ Layout stable - content KHÔNG bị shift
 * ✅ Body & Input thẳng hàng hoàn hảo
 * ✅ Scrollbar visible (như ChatGPT)
 * 
 * Key: Sử dụng class "chat-scroll" với scrollbar-gutter: stable
 */
export default function ChatWindowBody({
  messagesContainerRef,
  typingIndicatorRef,
  hookMessagesEndRef,
  messages,
  loading,
  hasMore,
  displayInfo,
  typingUser,
  currentUser,
  onRetryMessage,
  t,
}) {
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden chat-scroll"
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <div className="pt-4">
        {/* Loading More Indicator */}
        {loading && hasMore && messages.length > 0 && (
          <div className="flex justify-center py-4 mb-3">
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-white px-5 py-2.5 rounded-full shadow-md">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">
                {t("loading.more") || "Đang tải thêm..."}
              </span>
            </div>
          </div>
        )}

        {/* Empty State: New Conversation */}
        {messages.length === 0 && displayInfo.isNewConversation && (
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-sm">
              <div className="relative w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-5 overflow-hidden shadow-xl ring-4 ring-blue-100">
                {displayInfo.avatar ? (
                  <img
                    src={displayInfo.avatar}
                    alt={displayInfo.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayInfo.name[0]?.toUpperCase() || "?"
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {displayInfo.name}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {t("empty.newConversation") || "Bắt đầu cuộc trò chuyện"}
              </p>
            </div>
          </div>
        )}

        {/* Empty State: Existing Conversation */}
        {messages.length === 0 &&
          !displayInfo.isNewConversation &&
          !loading && (
            <div className="flex items-center justify-center min-h-[60vh] px-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-1">
                  {t("empty.title") || "Chưa có tin nhắn"}
                </p>
                <p className="text-gray-400 text-sm">
                  {t("empty.subtitle") || "Hãy bắt đầu cuộc trò chuyện!"}
                </p>
              </div>
            </div>
          )}

        {/* Message List */}
        {messages.length > 0 && (
          <MessageList
            messages={messages}
            activeUser={currentUser}
            isPrivateChat={displayInfo.type === "private"}
            isGroupChat={displayInfo.type === "group"}
            onRetryMessage={onRetryMessage}
          />
        )}

        {/* Typing Indicator */}
        {typingUser && (
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <div
              ref={typingIndicatorRef}
              className="flex items-start gap-3 mt-4 animate-fadeIn"
            >
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden shrink-0 shadow-md">
                {typingUser.avatar ? (
                  <img
                    src={typingUser.avatar}
                    alt={typingUser.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (typingUser.nickname || typingUser.fullName)?.[0]?.toUpperCase() ||
                  "?"
                )}
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3.5 shadow-md border border-gray-100">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  ></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll Anchor */}
        <div className="mx-auto max-w-3xl px-4">
          <div ref={hookMessagesEndRef} className="h-2" />
        </div>
      </div>
    </div>
  );
}