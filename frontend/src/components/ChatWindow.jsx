// frontend/src/components/ChatWindow.jsx
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";
import EmojiPicker from "./EmojiPicker";

export default function ChatWindow({ receiverId, receiverName, receiverAvatar, currentRoom, user }) {
  const { user: currentUser, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  
  const markedAsReadRef = useRef(false);

  const isPrivateChat = !!receiverId;
  const isGroupChat = !!currentRoom;
  const activeUser = user || currentUser;

  // Function to convert URLs in text to clickable links
  const linkifyText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-200 transition-colors break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const emoji = emojiObject.emoji;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    
    setText(newText);
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
    
    setShowEmojiPicker(false);
  };

  // Load messages
  useEffect(() => {
    if (!activeUser) return;

    markedAsReadRef.current = false;

    if (isPrivateChat && receiverId) {
      fetch(`http://localhost:5000/api/messages/${receiverId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          setMessages(data);
          
          const hasUnread = data.some(msg => 
            msg.sender === receiverId && 
            msg.receiver === activeUser.uid && 
            !msg.read
          );
          
          if (hasUnread && !markedAsReadRef.current) {
            markedAsReadRef.current = true;
            markAsRead();
          }
        })
        .catch(err => console.error("Load messages error:", err));
    } else if (isGroupChat && currentRoom) {
      fetch("http://localhost:5000/api/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => setMessages(data));
    }
  }, [activeUser, token, receiverId, currentRoom]);

  // Socket listeners
  useEffect(() => {
    if (!activeUser) return;

    if (isPrivateChat) {
      const handleReceiveMessage = (msg) => {
        if (
          (msg.sender === activeUser.uid && msg.receiver === receiverId) ||
          (msg.sender === receiverId && msg.receiver === activeUser.uid)
        ) {
          setMessages(prev => [...prev, msg]);
          
          if (msg.sender === receiverId && !markedAsReadRef.current) {
            markedAsReadRef.current = true;
            
            setTimeout(() => {
              markAsRead();
              markedAsReadRef.current = false;
            }, 500);
          }
        }
      };

      const handleTyping = ({ userId, isTyping }) => {
        if (userId === receiverId) {
          setIsTyping(isTyping);
        }
      };

      const handleMessagesRead = ({ userId }) => {
        if (userId === receiverId) {
          setMessages(prev => 
            prev.map(msg => 
              msg.sender === activeUser.uid && msg.receiver === receiverId
                ? { ...msg, read: true }
                : msg
            )
          );
        }
      };

      socket.on("receivePrivateMessage", handleReceiveMessage);
      socket.on("userTyping", handleTyping);
      socket.on("messagesRead", handleMessagesRead);

      return () => {
        socket.off("receivePrivateMessage", handleReceiveMessage);
        socket.off("userTyping", handleTyping);
        socket.off("messagesRead", handleMessagesRead);
      };
    } else if (isGroupChat) {
      socket.on("receiveMessage", (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      return () => socket.off("receiveMessage");
    }
  }, [activeUser, receiverId, currentRoom, isPrivateChat, isGroupChat]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const markAsRead = () => {
    if (!receiverId || !activeUser) return;
    
    socket.emit("markAsRead", {
      userId: activeUser.uid,
      friendId: receiverId
    });
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    if (isPrivateChat) {
      socket.emit("sendPrivateMessage", {
        senderId: activeUser.uid,
        receiverId,
        text,
      });
    } else if (isGroupChat) {
      socket.emit("sendMessage", {
        senderId: activeUser.uid,
        senderName: activeUser.nickname,
        text,
      });
    }

    setText("");
    handleTyping(false);
  };

  const handleTyping = (typing) => {
    if (!isPrivateChat) return;
    
    socket.emit("typing", {
      senderId: activeUser.uid,
      receiverId,
      isTyping: typing
    });
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    handleTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!activeUser) return null;

  if (!isPrivateChat && !isGroupChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-linear-to-brrom-gray-50 to-blue-50">
        <div className="text-center px-4">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Chào mừng đến với Chat
          </h2>
          <p className="text-gray-500 mb-1">
            Chọn một người bạn hoặc nhóm để bắt đầu trò chuyện
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Chat riêng tư</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Chat nhóm</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-linear-to-br from-gray-50 to-blue-50 overflow-hidden">
      {/* Header */}
      {isPrivateChat && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-linear-to-brrom-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden shrink-0">
              {receiverAvatar ? (
                <img src={receiverAvatar} alt={receiverName} className="w-full h-full object-cover" />
              ) : (
                receiverName?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-800 truncate">{receiverName}</h2>
              {isTyping ? (
                <p className="text-xs text-blue-500 italic flex items-center gap-1">
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </span>
                  Đang nhập...
                </p>
              ) : (
                <p className="text-xs text-green-500">● Online</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((msg, i) => {
          const isMe = msg.sender === activeUser.uid || msg.senderId === activeUser.uid;

          return (
            <div
              key={msg._id || i}
              className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg wrap-break-word
                  ${isMe
                    ? "bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
                    : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                  }`}
              >
                {!isMe && isGroupChat && (
                  <p className="text-xs font-semibold text-blue-600 mb-1.5 truncate">
                    {msg.senderName}
                  </p>
                )}
                
                {/* Message text with clickable links */}
                <p className="whitespace-pre-wrap wrap-break-word leading-relaxed text-sm">
                  {linkifyText(msg.text)}
                </p>
                
                {/* Timestamp & Status */}
                <div className={`flex items-center justify-end gap-2 mt-1.5 text-xs ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                  <span className="whitespace-nowrap">
                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  
                  {/* Status Indicator */}
                  {isMe && isPrivateChat && (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      {msg.read ? (
                        <>
                          <svg className="w-4 h-4 text-green-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                          </svg>
                          <span className="text-green-300 font-medium">Đã xem</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-blue-200 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                          </svg>
                          <span className="text-blue-200">Đã gửi</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg shrink-0">
        <div className="flex items-end gap-3 w-full">
          {/* Textarea with Emoji Button Inside */}
          <div className="flex-1 relative min-w-0">
            {/* Emoji Picker Component */}
            <EmojiPicker
              show={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiClick={handleEmojiClick}
            />

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
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

            {/* Emoji Button - Positioned absolutely inside textarea */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${
                showEmojiPicker 
                  ? "text-blue-500 bg-blue-50" 
                  : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
              }`}
              title="Chọn emoji"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 
              text-white rounded-2xl font-medium shadow-md
              hover:from-blue-600 hover:to-blue-700 hover:shadow-lg
              active:scale-95 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <svg 
              className="w-5 h-5 shrink-0" 
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