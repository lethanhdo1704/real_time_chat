// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null); // 🔥 NEW: Track socket instance
  const [isConnected, setIsConnected] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // 🔥 User có token → Connect
    if (user && token) {
      // 🔥 Chỉ connect 1 lần duy nhất
      if (!hasInitialized.current) {
        console.log('🔌 Connecting socket for user:', user.uid);
        
        const socketInstance = connectSocket(token);
        setSocket(socketInstance); // 🔥 NEW: Update state
        hasInitialized.current = true;

        const handleConnect = () => {
          console.log('✅ Connected');
          setIsConnected(true);
        };

        const handleDisconnect = () => {
          console.warn('⚠️ Disconnected');
          setIsConnected(false);
        };

        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);

        // 🔥 Check if already connected
        if (socketInstance.connected) {
          console.log('✅ Socket already connected');
          setIsConnected(true);
        }

        // 🔥 Cleanup chỉ gỡ listener, KHÔNG disconnect
        return () => {
          socketInstance.off('connect', handleConnect);
          socketInstance.off('disconnect', handleDisconnect);
        };
      }
    }

    // 🔥 User logout → Disconnect thật sự
    if (!user && hasInitialized.current) {
      console.log('👋 User logged out, disconnecting socket');
      disconnectSocket();
      setSocket(null); // 🔥 NEW: Clear socket state
      hasInitialized.current = false;
      setIsConnected(false);
    }
  }, [user]);

  // 🔥 NEW: Debug state changes
  useEffect(() => {
    console.log('🔍 [SocketContext] State:', {
      hasSocket: !!socket,
      isConnected,
      socketId: socket?.id,
      socketConnected: socket?.connected
    });
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}> {/* 🔥 FIXED: Export socket */}
      {children}
    </SocketContext.Provider>
  );
};

// ✅ Custom hook để lấy socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return getSocket();
};