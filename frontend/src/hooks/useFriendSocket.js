// frontend/src/hooks/useFriendSocket.js
import { useEffect, useCallback, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import useFriendStore from '../store/friendStore';
import friendService from '../services/friendService';

/**
 * Hook để handle tất cả friend socket events
 * 
 * 🔥 ULTIMATE FIX:
 * - CHỈ fetch khi socket connected (KHÔNG fetch sớm)
 * - Single source of truth cho friend data fetching
 */
export default function useFriendSocket() {
  const { socket, isConnected } = useContext(SocketContext);
  const hasFetchedRef = useRef(false);
  
  const { 
    addFriendRequest, 
    removeFriendRequest,
    addFriend,
    removeFriend,
    removeSentRequest,
    markRequestAsSeen,
    setFriendsData,
    isCacheValid,
  } = useFriendStore();

  // ============================================
  // EVENT HANDLERS
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
  // 🔥 CRITICAL: ONLY fetch when socket connected
  // ============================================
  
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⏳ [useFriendSocket] Waiting for socket connection...');
      return;
    }

    // Already fetched
    if (hasFetchedRef.current) {
      console.log('⏭️ [useFriendSocket] Already fetched, skip');
      return;
    }

    // Valid cache exists
    if (isCacheValid()) {
      console.log('✅ [useFriendSocket] Using cached friend data');
      hasFetchedRef.current = true;
      return;
    }

    console.log('🔄 [useFriendSocket] Socket connected → Fetching friends data...');
    hasFetchedRef.current = true;

    friendService.getFriendsList()
      .then((data) => {
        console.log('✅ [useFriendSocket] Friend data fetched:', {
          friends: data.friends?.length || 0,
          requests: data.requests?.length || 0,
          sentRequests: data.sentRequests?.length || 0,
        });
        setFriendsData(data);
      })
      .catch((err) => {
        console.error('❌ [useFriendSocket] Failed to fetch friends:', err);
        hasFetchedRef.current = false; // Allow retry
      });

  }, [socket, isConnected, setFriendsData, isCacheValid]);

  // ============================================
  // SOCKET LISTENERS
  // ============================================
  
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    console.log('🔌 [useFriendSocket] Registering friend socket listeners');

    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('friend_request_accepted', handleFriendRequestAccepted);
    socket.on('friend_added', handleFriendAdded);
    socket.on('friend_request_rejected', handleFriendRequestRejected);
    socket.on('friend_request_cancelled', handleFriendRequestCancelled);
    socket.on('friend_removed', handleFriendRemoved);
    socket.on('friend_request_seen', handleFriendRequestSeen);
    
    console.log('✅ [useFriendSocket] All friend listeners registered');

    return () => {
      console.log('🧹 [useFriendSocket] Cleaning up listeners');
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('friend_request_accepted', handleFriendRequestAccepted);
      socket.off('friend_added', handleFriendAdded);
      socket.off('friend_request_rejected', handleFriendRequestRejected);
      socket.off('friend_request_cancelled', handleFriendRequestCancelled);
      socket.off('friend_removed', handleFriendRemoved);
      socket.off('friend_request_seen', handleFriendRequestSeen);
    };
  }, [
    socket,
    isConnected,
    handleFriendRequestReceived,
    handleFriendRequestAccepted,
    handleFriendAdded,
    handleFriendRequestRejected,
    handleFriendRequestCancelled,
    handleFriendRemoved,
    handleFriendRequestSeen
  ]);

  // Reset fetch flag on disconnect
  useEffect(() => {
    if (!isConnected) {
      hasFetchedRef.current = false;
    }
  }, [isConnected]);

  return null;
}