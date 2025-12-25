// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import socketService from '../services/socketService';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Connect when user is authenticated
    if (user && token) {
      console.log('🔌 Connecting socket for user:', user.uid);
      
      socketService.connect(token);

      // Setup connection status listeners
      const handleConnect = () => {
        console.log('✅ Socket connected');
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
      };
    }

    // Disconnect when user logs out
    if (!user) {
      console.log('🔌 User logged out, disconnecting socket');
      socketService.disconnect();
      setIsConnected(false);
      setError(null);
    }
  }, [user]);

  const value = {
    socket: socketService,
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
  return context;
};