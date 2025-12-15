import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";
import "../styles/ChatWindow.css";

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
    <div className="chat-window">
      <div className="messages-list">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === user.uid;

          return (
            <div
              key={i}
              className={`message ${isMe ? "me" : "other"}`}
            >
              <div className="message-content">
                {!isMe && (
                  <p className="sender-name">{msg.senderName}</p>
                )}
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
}
