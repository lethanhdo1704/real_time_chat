// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import socket from "../socket";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    // Chỉ join khi có user và chưa join trước đó
    if (user?.uid && !hasJoinedRef.current) {
      socket.emit("joinPrivate", user.uid);
      hasJoinedRef.current = true;
    }

    // Reset khi user logout
    if (!user && hasJoinedRef.current) {
      hasJoinedRef.current = false;
      socket.disconnect();
    }

    // Reconnect khi có user
    if (user && !socket.connected) {
      socket.connect();
    }
  }, [user?.uid]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};