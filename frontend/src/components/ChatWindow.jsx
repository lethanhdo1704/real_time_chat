import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";

export default function ChatWindow() {
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // Load message + socket
  useEffect(() => {
    if (!user) return;

    // Load tin nhắn từ backend
    fetch("http://localhost:5000/api/messages", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setMessages(data));

    // Nhận realtime message
    socket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, [user, token]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("sendMessage", {
      senderId: user.uid,
      senderName: user.nickname,
      text,
    });

    setText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-gray-50 to-blue-50">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === user.uid;

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg
                  ${isMe
                    ? "bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
                    : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                  }`}
              >
                {!isMe && (
                  <p className="text-xs font-semibold text-blue-600 mb-1.5">
                    {msg.senderName}
                  </p>
                )}
                <p className="whitespace-pre-wrap wrap-break-words leading-relaxed">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex items-end gap-3 max-w-5xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              rows="1"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                resize-none max-h-32 transition-all duration-200
                placeholder:text-gray-400"
              style={{
                minHeight: '48px',
                maxHeight: '128px'
              }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 
              text-white rounded-2xl font-medium shadow-md
              hover:from-blue-600 hover:to-blue-700 hover:shadow-lg
              active:scale-95 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              flex items-center gap-2 whitespace-nowrap"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}