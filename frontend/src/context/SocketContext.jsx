// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socketService';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
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
        setSocket(socketInstance); // ⚠️ Trigger re-render cho components
        hasInitialized.current = true;

        const handleConnect = () => {
          console.log('✅ Socket connected:', socketInstance.id);
          setIsConnected(true);
          setSocket(socketInstance); // 🔥 Re-trigger để components biết socket đã sẵn sàng
        };

        const handleDisconnect = () => {
          console.warn('⚠️ Socket disconnected');
          setIsConnected(false);
        };

        const handleReconnect = (attemptNumber) => {
          console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
          setIsConnected(true);
          setSocket(socketInstance); // 🔥 Re-trigger để components đăng ký lại listeners
        };

        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);
        socketInstance.io.on('reconnect', handleReconnect);

        // 🔥 Check if already connected
        if (socketInstance.connected) {
          console.log('✅ Socket already connected');
          setIsConnected(true);
        }

        // 🔥 Cleanup chỉ gỡ listener, KHÔNG disconnect
        return () => {
          socketInstance.off('connect', handleConnect);
          socketInstance.off('disconnect', handleDisconnect);
          socketInstance.io.off('reconnect', handleReconnect);
        };
      }
    }

    // 🔥 User logout → Disconnect thật sự
    if (!user && hasInitialized.current) {
      console.log('👋 User logged out, disconnecting socket');
      disconnectSocket();
      setSocket(null);
      hasInitialized.current = false;
      setIsConnected(false);
    }
  }, [user]);

  // 🔥 Debug state changes
  useEffect(() => {
    console.log('🔍 [SocketContext] State:', {
      hasSocket: !!socket,
      isConnected,
      socketId: socket?.id,
      socketConnected: socket?.connected
    });
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// ✅ FIXED: Custom hook trả về context thay vì getSocket()
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context; // 🔥 Trả về { socket, isConnected }
};