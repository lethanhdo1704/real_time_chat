// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (user && token) {
    console.log('🔌 Connecting socket for user:', user.uid);

    const socket = connectSocket(token);

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

    // ✅ Cleanup CHỈ gỡ listener
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      // ❌ KHÔNG disconnect socket ở đây
    };
  }

  // ✅ Logout thật sự
  if (!user) {
    disconnectSocket();
    setIsConnected(false);
  }
}, [user]);


  // ✅ Context chỉ cung cấp connection status
  // Hooks sẽ tự gọi getSocket() khi cần
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
  return getSocket(); // Trả về socket instance
};