// frontend/src/hooks/useFriendSocket.js
import { useEffect, useCallback } from 'react';
import { getSocket } from '../services/socketService';
import useFriendStore from '../store/friendStore';

/**
 * Hook để handle tất cả friend socket events
 * 
 * NHIỆM VỤ:
 * - Đăng ký listeners khi component mount
 * - Gỡ listeners khi component unmount
 * - Update store khi nhận events
 */
export default function useFriendSocket() {
  const { 
    addFriendRequest, 
    removeFriendRequest,
    addFriend,
    removeFriend,
    removeSentRequest,
  } = useFriendStore();

  // ============================================
  // EVENT HANDLERS - ✅ Stable callbacks
  // ============================================
  
  const handleFriendRequestReceived = useCallback((data) => {
    console.log('📩 Friend request received:', data);
    
    addFriendRequest({
      _id: data.requestId,
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      timestamp: data.timestamp
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
    console.log('✅ Friend request accepted:', data);
    
    removeSentRequest(data.uid);
    addFriend({
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      timestamp: data.timestamp
    });
  }, [removeSentRequest, addFriend]);

  const handleFriendAdded = useCallback((data) => {
    console.log('👥 Friend added:', data);
    
    removeFriendRequest(data.uid);
    addFriend({
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      timestamp: data.timestamp
    });
  }, [removeFriendRequest, addFriend]);

  const handleFriendRequestRejected = useCallback((data) => {
    console.log('❌ Friend request rejected:', data);
    removeSentRequest(data.uid);
  }, [removeSentRequest]);

  const handleFriendRequestCancelled = useCallback((data) => {
    console.log('🚫 Friend request cancelled:', data);
    removeFriendRequest(data.uid);
  }, [removeFriendRequest]);

  const handleFriendRemoved = useCallback((data) => {
    console.log('💔 Friend removed:', data);
    removeFriend(data.uid);
  }, [removeFriend]);

  // ============================================
  // SOCKET LISTENERS SETUP - ✅ Simplified
  // ============================================
  
  useEffect(() => {
    const socket = getSocket();
    
    // ✅ Đơn giản: Nếu không có socket thì return
    if (!socket) {
      console.log('⏳ Socket not ready yet');
      return;
    }

    console.log('🔌 Setting up friend socket listeners');

    // ✅ Đăng ký listeners
    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('friend_request_accepted', handleFriendRequestAccepted);
    socket.on('friend_added', handleFriendAdded);
    socket.on('friend_request_rejected', handleFriendRequestRejected);
    socket.on('friend_request_cancelled', handleFriendRequestCancelled);
    socket.on('friend_removed', handleFriendRemoved);

    // ✅ Cleanup
    return () => {
      console.log('🔌 Cleaning up friend socket listeners');
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('friend_request_accepted', handleFriendRequestAccepted);
      socket.off('friend_added', handleFriendAdded);
      socket.off('friend_request_rejected', handleFriendRequestRejected);
      socket.off('friend_request_cancelled', handleFriendRequestCancelled);
      socket.off('friend_removed', handleFriendRemoved);
    };
  }, [
    handleFriendRequestReceived,
    handleFriendRequestAccepted,
    handleFriendAdded,
    handleFriendRequestRejected,
    handleFriendRequestCancelled,
    handleFriendRemoved
  ]);

  return null;
}