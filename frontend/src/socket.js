// frontend/src/socket.js
import { io } from "socket.io-client";

/**
 * Socket.io client with authentication
 * Token is retrieved from localStorage/sessionStorage
 */

// Get token helper
const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Create socket instance
const socket = io("http://localhost:5000", {
  autoConnect: false, // ← Changed to false - connect manually after token is set
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  transports: ["websocket", "polling"],
  auth: (cb) => {
    // Dynamic auth function - gets token at connection time
    const token = getToken();
    cb({ token });
  },
});


socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
  
  // If authentication fails, try to reconnect with new token
  if (error.message === "Authentication error") {
    const token = getToken();
    if (token) {
      socket.auth = { token };
      socket.connect();
    }
  }
});


socket.on("error", (data) => {
  console.error("❌ Socket error:", data);
});

// Helper function to connect socket with token
export const connectSocket = () => {
  const token = getToken();
  
  if (!token) {
    console.warn("⚠️ No token found, cannot connect socket");
    return;
  }
  
  
  socket.auth = { token };
  socket.connect();
};

// Helper function to disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;