import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";
import "../styles/ChatWindow.css";

export default function ChatWindow() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

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
      </div>

      <div className="input-area">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
}
