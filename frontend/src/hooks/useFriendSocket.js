// frontend/src/hooks/useFriendSocket.js
import { useEffect, useCallback, useContext } from 'react';
import { SocketContext } from '../context/SocketContext'; // 🔥 Use context instead
import useFriendStore from '../store/friendStore';

/**
 * Hook để handle tất cả friend socket events
 * 
 * 🔥 FIXES:
 * - Sử dụng SocketContext để đảm bảo socket đã sẵn sàng
 * - Re-register listeners khi socket reconnect
 */
export default function useFriendSocket() {
  const { socket, isConnected } = useContext(SocketContext); // 🔥 Get from context
  
  const { 
    addFriendRequest, 
    removeFriendRequest,
    addFriend,
    removeFriend,
    removeSentRequest,
    markRequestAsSeen,
  } = useFriendStore();

  // ============================================
  // EVENT HANDLERS - ✅ Stable callbacks
  // ============================================
  
  const handleFriendRequestReceived = useCallback((data) => {
    console.log('📩 [useFriendSocket] Friend request received:', data);
    
    addFriendRequest({
      _id: data.requestId,
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      timestamp: data.timestamp,
      seenAt: null
    });

    // Optional: Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Lời mời kết bạn mới', {
        body: `${data.nickname} đã gửi lời mời kết bạn`,
        icon: data.avatar
      });
    }
  }, [addFriendRequest]);

  const handleFriendRequestAccepted = useCallback((data) => {
    console.log('✅ [useFriendSocket] Friend request accepted:', data);
    
    removeSentRequest(data.uid);
    addFriend({
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      timestamp: data.timestamp
    });
  }, [removeSentRequest, addFriend]);

  const handleFriendAdded = useCallback((data) => {
    console.log('👥 [useFriendSocket] Friend added:', data);
    
    removeFriendRequest(data.uid);
    addFriend({
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      timestamp: data.timestamp
    });
  }, [removeFriendRequest, addFriend]);

  const handleFriendRequestRejected = useCallback((data) => {
    console.log('❌ [useFriendSocket] Friend request rejected:', data);
    removeSentRequest(data.uid);
  }, [removeSentRequest]);

  const handleFriendRequestCancelled = useCallback((data) => {
    console.log('🚫 [useFriendSocket] Friend request cancelled:', data);
    removeFriendRequest(data.uid);
  }, [removeFriendRequest]);

  const handleFriendRemoved = useCallback((data) => {
    console.log('💔 [useFriendSocket] Friend removed:', data);
    removeFriend(data.uid);
  }, [removeFriend]);

  const handleFriendRequestSeen = useCallback((data) => {
    console.log('👁️ [useFriendSocket] Friend request seen:', data);
    markRequestAsSeen(data.requestId);
  }, [markRequestAsSeen]);

  // ============================================
  // 🔥 SOCKET LISTENERS - Wait for connection
  // ============================================
  
  useEffect(() => {
    // 🔥 Wait for both socket AND connection
    if (!socket || !isConnected) {
      console.log('⏳ [useFriendSocket] Waiting for socket connection...', { socket: !!socket, isConnected });
      return;
    }

    console.log('🔌 [useFriendSocket] Registering friend socket listeners');

    // Register all listeners
    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('friend_request_accepted', handleFriendRequestAccepted);
    socket.on('friend_added', handleFriendAdded);
    socket.on('friend_request_rejected', handleFriendRequestRejected);
    socket.on('friend_request_cancelled', handleFriendRequestCancelled);
    socket.on('friend_removed', handleFriendRemoved);
    socket.on('friend_request_seen', handleFriendRequestSeen);
    
    console.log('✅ [useFriendSocket] All friend listeners registered successfully');

    // 🔥 DEBUG: Catch all socket events (remove in production)
    const debugHandler = (eventName, ...args) => {
      if (eventName.startsWith('friend_')) {
        console.log(`🔔 [Socket Debug] Event: ${eventName}`, args);
      }
    };
    socket.onAny(debugHandler);

    // Cleanup
    return () => {
      console.log('🧹 [useFriendSocket] Cleaning up friend listeners');
      
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('friend_request_accepted', handleFriendRequestAccepted);
      socket.off('friend_added', handleFriendAdded);
      socket.off('friend_request_rejected', handleFriendRequestRejected);
      socket.off('friend_request_cancelled', handleFriendRequestCancelled);
      socket.off('friend_removed', handleFriendRemoved);
      socket.off('friend_request_seen', handleFriendRequestSeen);
      socket.offAny(debugHandler);
    };
  }, [
    socket,
    isConnected, // 🔥 Re-register when connection state changes
    handleFriendRequestReceived,
    handleFriendRequestAccepted,
    handleFriendAdded,
    handleFriendRequestRejected,
    handleFriendRequestCancelled,
    handleFriendRemoved,
    handleFriendRequestSeen
  ]);

  return null;
}