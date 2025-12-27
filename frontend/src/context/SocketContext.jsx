// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(false);
  const hasInitialized = useRef(false); // 🔥 FIX: Track initialization

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // 🔥 FIX 1: User có token → Connect
    if (user && token) {
      // 🔥 FIX 2: Chỉ connect 1 lần duy nhất
      if (!hasInitialized.current) {
        console.log('🔌 Connecting socket for user:', user.uid);
        
        const socket = connectSocket(token);
        hasInitialized.current = true;

        const handleConnect = () => {
          console.log('✅ Connected');
          setIsConnected(true);
        };

        const handleDisconnect = () => {
          console.warn('⚠️ Disconnected');
          setIsConnected(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // 🔥 FIX 3: Cleanup chỉ gỡ listener, KHÔNG disconnect
        return () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
        };
      }
    }

    // 🔥 FIX 4: User logout → Disconnect thật sự
    if (!user && hasInitialized.current) {
      console.log('👋 User logged out, disconnecting socket');
      disconnectSocket();
      hasInitialized.current = false;
      setIsConnected(false);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
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