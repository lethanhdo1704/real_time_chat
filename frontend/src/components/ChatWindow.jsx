import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";
import "../styles/ChatWindow.css";

export default function ChatWindow() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    // Lấy tin nhắn từ MongoDB
    fetch("http://localhost:5000/api/messages")
      .then(res => res.json())
      .then(data => setMessages(data));

    // Nhận tin nhắn realtime
    socket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  // Auto scroll mỗi khi messages thay đổi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    const newMsg = {
      senderId: user._id,
      senderName: user.username,
      text,
    };

    socket.emit("sendMessage", newMsg);
    setText("");
  };

  // Xử lý khi nhấn Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-window">
      <div className="messages-list">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.senderId === user._id ? "me" : "other"}`}
          >
            <div className="message-content">
              {msg.senderId !== user._id && (
                <p className="sender-name">{msg.senderName}</p>
              )}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Dòng đánh dấu cuối để scroll tới */}
        <div ref={bottomRef}></div>
      </div>

      <div className="input-area">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
}