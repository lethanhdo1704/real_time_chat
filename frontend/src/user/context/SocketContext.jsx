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

  // ============================================
  // 🔥 SINGLE EFFECT: Socket lifecycle
  // ============================================
  useEffect(() => {
    const userId = user?.uid;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // 🔥 Connect: Only when we have user AND haven't initialized
    if (userId && token && !hasInitialized.current) {
      console.log('🔌 [SocketContext] Connecting socket for user:', userId);
      
      const socketInstance = connectSocket(token);
      setSocket(socketInstance);
      hasInitialized.current = true;

      // Event handlers
      const handleConnect = () => {
        console.log('✅ [SocketContext] Socket connected:', socketInstance.id);
        setIsConnected(true);
      };

      const handleDisconnect = () => {
        console.warn('⚠️ [SocketContext] Socket disconnected');
        setIsConnected(false);
      };

      const handleReconnect = (attemptNumber) => {
        console.log(`🔄 [SocketContext] Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
      };

      // Register listeners
      socketInstance.on('connect', handleConnect);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.io.on('reconnect', handleReconnect);

      // Initial state check
      if (socketInstance.connected) {
        console.log('✅ [SocketContext] Socket already connected');
        setIsConnected(true);
      }

      // 🔥 Cleanup: ONLY remove listeners, DON'T disconnect
      return () => {
        console.log('🧹 [SocketContext] Removing event listeners (NOT disconnecting)');
        socketInstance.off('connect', handleConnect);
        socketInstance.off('disconnect', handleDisconnect);
        socketInstance.io.off('reconnect', handleReconnect);
      };
    }

    // 🔥 Disconnect: ONLY when user logs out
    if (!userId && hasInitialized.current) {
      console.log('👋 [SocketContext] User logged out, disconnecting socket');
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      hasInitialized.current = false;
    }
  }, [user?.uid]); // 🔥 ONLY depend on user ID primitive value

  // Debug state
  useEffect(() => {
    console.log('🔍 [SocketContext] State:', {
      hasSocket: !!socket,
      isConnected,
      socketId: socket?.id,
      socketConnected: socket?.connected
    });
  }, [socket, isConnected]);

  // User update listener
  useEffect(() => {
    if (!socket) return;

    const handleUserUpdate = (payload) => {
      console.log('🔥 [SocketContext] USER UPDATE RECEIVED:', payload);
    };

    socket.on('user:update', handleUserUpdate);
    console.log('📡 [SocketContext] Listening for user:update');

    return () => {
      socket.off('user:update', handleUserUpdate);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};