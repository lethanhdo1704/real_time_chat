// frontend/src/hooks/useFriendSocket.js
import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import useFriendStore from '../store/friendStore';

/**
 * Hook để handle tất cả friend socket events
 */
export default function useFriendSocket() {
  const socket = useSocket();
  const { 
    addFriendRequest, 
    removeFriendRequest,
    addFriend,
    removeFriend,
    removeSentRequest,
    updateRequestStatus
  } = useFriendStore();

  // ============================================
  // 1️⃣ FRIEND REQUEST RECEIVED
  // ============================================
  const handleFriendRequestReceived = useCallback((data) => {
    console.log('📩 Friend request received:', data);
    
    try {
      // Thêm vào danh sách requests
      addFriendRequest({
        _id: data.requestId,
        uid: data.uid,
        nickname: data.nickname,
        avatar: data.avatar,
        timestamp: data.timestamp
      });

      // Optional: Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Lời mời kết bạn mới', {
          body: `${data.nickname} đã gửi lời mời kết bạn`,
          icon: data.avatar
        });
      }
    } catch (error) {
      console.error('❌ Error handling friend request received:', error);
    }
  }, [addFriendRequest]);

  // ============================================
  // 2️⃣ FRIEND REQUEST ACCEPTED (A nhận - request được chấp nhận)
  // ============================================
  const handleFriendRequestAccepted = useCallback((data) => {
    console.log('✅ Friend request accepted:', data);
    
    try {
      // Xóa khỏi sent requests
      removeSentRequest(data.uid);
      
      // Thêm vào friend list
      addFriend({
        uid: data.uid,
        nickname: data.nickname,
        avatar: data.avatar,
        timestamp: data.timestamp
      });

      // Optional: Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Lời mời được chấp nhận', {
          body: `${data.nickname} đã chấp nhận lời mời kết bạn`,
          icon: data.avatar
        });
      }
    } catch (error) {
      console.error('❌ Error handling friend request accepted:', error);
    }
  }, [removeSentRequest, addFriend]);

  // ============================================
  // 3️⃣ FRIEND ADDED (B nhận - được thêm vào friend list)
  // ============================================
  const handleFriendAdded = useCallback((data) => {
    console.log('👥 Friend added:', data);
    
    try {
      // Xóa khỏi requests (người B đã accept)
      removeFriendRequest(data.uid);
      
      // Thêm vào friend list
      addFriend({
        uid: data.uid,
        nickname: data.nickname,
        avatar: data.avatar,
        timestamp: data.timestamp
      });
    } catch (error) {
      console.error('❌ Error handling friend added:', error);
    }
  }, [removeFriendRequest, addFriend]);

  // ============================================
  // 4️⃣ FRIEND REQUEST REJECTED
  // ============================================
  const handleFriendRequestRejected = useCallback((data) => {
    console.log('❌ Friend request rejected:', data);
    
    try {
      // Xóa khỏi sent requests
      removeSentRequest(data.uid);
      
      // Optional: Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Lời mời bị từ chối', {
          body: 'Lời mời kết bạn của bạn đã bị từ chối'
        });
      }
    } catch (error) {
      console.error('❌ Error handling friend request rejected:', error);
    }
  }, [removeSentRequest]);

  // ============================================
  // 5️⃣ FRIEND REQUEST CANCELLED
  // ============================================
  const handleFriendRequestCancelled = useCallback((data) => {
    console.log('🚫 Friend request cancelled:', data);
    
    try {
      // Xóa khỏi requests
      removeFriendRequest(data.uid);
    } catch (error) {
      console.error('❌ Error handling friend request cancelled:', error);
    }
  }, [removeFriendRequest]);

  // ============================================
  // 6️⃣ FRIEND REMOVED (Unfriended)
  // ============================================
  const handleFriendRemoved = useCallback((data) => {
    console.log('💔 Friend removed:', data);
    
    try {
      // Xóa khỏi friend list
      removeFriend(data.uid);
      
      // Optional: Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Đã hủy kết bạn', {
          body: 'Một người bạn đã hủy kết bạn với bạn'
        });
      }
    } catch (error) {
      console.error('❌ Error handling friend removed:', error);
    }
  }, [removeFriend]);

  // ============================================
  // 7️⃣ SETUP SOCKET LISTENERS
  // ============================================
  useEffect(() => {
    // Kiểm tra socket có tồn tại và đã connected chưa
    if (!socket) {
      console.log('⏳ Socket not available yet');
      return;
    }

    // Kiểm tra socket có method 'on' không (đảm bảo là socket instance thật)
    if (typeof socket.on !== 'function') {
      console.warn('⚠️ Socket does not have "on" method');
      return;
    }

    // Chờ socket connected trước khi setup listeners
    if (!socket.connected) {
      console.log('⏳ Socket not connected yet, waiting...');
      
      // Lắng nghe sự kiện connect
      const handleConnect = () => {
        console.log('✅ Socket connected, setting up friend listeners...');
        setupListeners();
      };
      
      socket.once('connect', handleConnect);
      
      return () => {
        socket.off('connect', handleConnect);
      };
    }

    // Nếu đã connected, setup luôn
    setupListeners();

    function setupListeners() {
      console.log('🔌 Setting up friend socket listeners...');

      // Register all listeners
      socket.on('friend_request_received', handleFriendRequestReceived);
      socket.on('friend_request_accepted', handleFriendRequestAccepted);
      socket.on('friend_added', handleFriendAdded);
      socket.on('friend_request_rejected', handleFriendRequestRejected);
      socket.on('friend_request_cancelled', handleFriendRequestCancelled);
      socket.on('friend_removed', handleFriendRemoved);
    }

    // Cleanup
    return () => {
      if (socket && typeof socket.off === 'function') {
        console.log('🔌 Cleaning up friend socket listeners...');
        socket.off('friend_request_received', handleFriendRequestReceived);
        socket.off('friend_request_accepted', handleFriendRequestAccepted);
        socket.off('friend_added', handleFriendAdded);
        socket.off('friend_request_rejected', handleFriendRequestRejected);
        socket.off('friend_request_cancelled', handleFriendRequestCancelled);
        socket.off('friend_removed', handleFriendRemoved);
      }
    };
  }, [
    socket,
    handleFriendRequestReceived,
    handleFriendRequestAccepted,
    handleFriendAdded,
    handleFriendRequestRejected,
    handleFriendRequestCancelled,
    handleFriendRemoved
  ]);

  return null; // Hook không return gì, chỉ setup listeners
}