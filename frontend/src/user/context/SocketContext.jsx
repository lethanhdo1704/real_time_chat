// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socketService';
import useChatStore from '../store/chat/chatStore';
import BanModal from '../components/common/BanModal'; // 🔥 THÊM IMPORT

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const hasInitialized = useRef(false);
  
  // 🔥 THÊM STATE CHO BAN MODAL
  const [banInfo, setBanInfo] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);

  // ============================================
  // 🔥 STABLE CALLBACK REFS - Prevent re-registration
  // ============================================
  const handleSettingsUpdatedRef = useRef(null);
  const handleUserUpdateRef = useRef(null);

  // ============================================
  // UPDATE CALLBACK REFS (no deps = stable)
  // ============================================
  useEffect(() => {
    handleSettingsUpdatedRef.current = (payload) => {
      console.log('🔧 [SocketContext] Conversation settings updated:', payload);
      
      const { conversationId, messagePermission, updatedBy, updatedAt } = payload;

      useChatStore.getState().updateConversation(conversationId, {
        messagePermission,
        updatedBy,
        updatedAt,
      });

      console.log('✅ [SocketContext] Store updated with new messagePermission:', messagePermission);
    };

    handleUserUpdateRef.current = (payload) => {
      console.log('🔥 [SocketContext] USER UPDATE RECEIVED:', payload);
    };
  });

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

      // 🔥 XỬ LÝ SỰ KIỆN BAN
      const handleBannedEvent = (data) => {
        console.log('🚨 [SocketContext] User banned:', data);
        setBanInfo(data);
        setShowBanModal(true);
      };

      // Register listeners
      socketInstance.on('connect', handleConnect);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.io.on('reconnect', handleReconnect);
      socketInstance.on('banned', handleBannedEvent); // 🔥 THÊM LISTENER

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
        socketInstance.off('banned', handleBannedEvent); // 🔥 THÊM CLEANUP
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
  }, [user?.uid]);

  // ============================================
  // 🔥 REGISTER LISTENERS - Using stable refs
  // ============================================
  useEffect(() => {
    if (!socket) return;

    // Wrapper functions that call the refs
    const onSettingsUpdated = (payload) => {
      handleSettingsUpdatedRef.current?.(payload);
    };

    const onUserUpdate = (payload) => {
      handleUserUpdateRef.current?.(payload);
    };

    // Register listeners ONCE per socket instance
    socket.on('conversation:settings_updated', onSettingsUpdated);
    socket.on('user:update', onUserUpdate);
    
    console.log('📡 [SocketContext] Listeners registered:', [
      'conversation:settings_updated',
      'user:update'
    ]);

    // Cleanup when socket changes or unmounts
    return () => {
      socket.off('conversation:settings_updated', onSettingsUpdated);
      socket.off('user:update', onUserUpdate);
      console.log('🧹 [SocketContext] Listeners removed');
    };
  }, [socket]); // Only re-run when socket instance changes (reconnect)

  // Debug state
  useEffect(() => {
    console.log('🔍 [SocketContext] State:', {
      hasSocket: !!socket,
      isConnected,
      socketId: socket?.id,
      socketConnected: socket?.connected
    });
  }, [socket, isConnected]);

  // 🔥 XỬ LÝ CONFIRM TỪ MODAL
  const handleBanConfirm = () => {
    // Clear tokens
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem('friend-storage');
    
    // Reset states
    setBanInfo(null);
    setShowBanModal(false);
    
    // Redirect
    window.location.href = "/login";
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
      {/* 🔥 HIỂN THỊ MODAL */}
      <BanModal 
        isOpen={showBanModal}
        banInfo={banInfo}
        onConfirm={handleBanConfirm}
      />
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