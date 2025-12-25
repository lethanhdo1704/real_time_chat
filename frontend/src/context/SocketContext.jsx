// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import socketService from '../services/socketService';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null); // ✅ Store actual socket instance
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Connect when user is authenticated
    if (user && token) {
      console.log('🔌 Connecting socket for user:', user.uid);
      
      socketService.connect(token);
      
      // ✅ Get the actual socket instance
      const socketInstance = socketService.getSocket();
      setSocket(socketInstance);

      // Setup connection status listeners
      const handleConnect = () => {
        console.log('✅ Socket connected:', socketInstance.id);
        setIsConnected(true);
        setError(null);
      };

      const handleDisconnect = (reason) => {
        console.warn('⚠️ Socket disconnected:', reason);
        setIsConnected(false);
      };

      const handleConnectError = (err) => {
        console.error('❌ Socket connection error:', err.message);
        setError(err.message);
        setIsConnected(false);
      };

      // Subscribe to connection events
      socketService.on('connect', handleConnect);
      socketService.on('disconnect', handleDisconnect);
      socketService.on('connect_error', handleConnectError);

      // Cleanup
      return () => {
        socketService.off('connect', handleConnect);
        socketService.off('disconnect', handleDisconnect);
        socketService.off('connect_error', handleConnectError);
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }

    // Disconnect when user logs out
    if (!user) {
      console.log('🔌 User logged out, disconnecting socket');
      socketService.disconnect();
      setSocket(null);
      setIsConnected(false);
      setError(null);
    }
  }, [user]);

  const value = {
    socket, // ✅ Return actual socket instance, not service
    isConnected,
    error,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context.socket; // ✅ Return socket instance
};