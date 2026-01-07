import { useEffect, useCallback, useContext, useRef } from 'react';
import { SocketContext } from '../../context/SocketContext';
import useFriendStore from '../../store/friendStore';
import friendService from '../../services/friendService';

/**
 * Hook để handle tất cả friend socket events
 * 
 * 🔥 COMPLETE VERSION:
 * - Friend request events
 * - Presence events (user_online, user_offline)
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
    setFriendOnline,
    setFriendOffline,
  } = useFriendStore();

  // ============================================
  // EVENT HANDLERS - FRIEND REQUESTS
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
      timestamp: data.timestamp,
      isOnline: false, // Default to offline, will be updated by presence events
      lastSeen: null,
    });
  }, [removeSentRequest, addFriend]);

  const handleFriendAdded = useCallback((data) => {
    console.log('👥 [useFriendSocket] Friend added:', data);
    
    removeFriendRequest(data.uid);
    addFriend({
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      timestamp: data.timestamp,
      isOnline: false, // Default to offline
      lastSeen: null,
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
  // 🆕 EVENT HANDLERS - PRESENCE
  // ============================================
  
  /**
   * Handle user_online event
   * Backend sends when a friend connects
   * 
   * WHY: Friend just connected = they are ONLINE now
   */
  const handleUserOnline = useCallback((data) => {
    const { uid } = data;
    
    if (!uid) {
      console.warn('⚠️ [useFriendSocket] user_online: missing uid');
      return;
    }
    
    console.log('🟢 [useFriendSocket] User ONLINE:', uid);
    
    // Update store: isOnline = true, lastSeen = null
    setFriendOnline(uid);
  }, [setFriendOnline]);

  /**
   * Handle user_offline event
   * Backend sends when a friend disconnects
   * 
   * WHY: Friend disconnected = they are OFFLINE now
   * WHY: lastSeen = timestamp when they LEFT
   */
  const handleUserOffline = useCallback((data) => {
    const { uid, lastSeen } = data;
    
    if (!uid) {
      console.warn('⚠️ [useFriendSocket] user_offline: missing uid');
      return;
    }
    
    console.log('⚪ [useFriendSocket] User OFFLINE:', uid, 'lastSeen:', lastSeen);
    
    // Update store: isOnline = false, lastSeen = when they left
    setFriendOffline(uid, lastSeen);
  }, [setFriendOffline]);

  // ============================================
  // 🔥 FETCH FRIENDS DATA (on connection)
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

    // ============================================
    // Friend request events
    // ============================================
    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('friend_request_accepted', handleFriendRequestAccepted);
    socket.on('friend_added', handleFriendAdded);
    socket.on('friend_request_rejected', handleFriendRequestRejected);
    socket.on('friend_request_cancelled', handleFriendRequestCancelled);
    socket.on('friend_removed', handleFriendRemoved);
    socket.on('friend_request_seen', handleFriendRequestSeen);
    
    // ============================================
    // 🆕 PRESENCE EVENTS (NEW)
    // ============================================
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    
    console.log('✅ [useFriendSocket] All listeners registered (including presence)');

    return () => {
      console.log('🧹 [useFriendSocket] Cleaning up listeners');
      
      // Friend request cleanup
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('friend_request_accepted', handleFriendRequestAccepted);
      socket.off('friend_added', handleFriendAdded);
      socket.off('friend_request_rejected', handleFriendRequestRejected);
      socket.off('friend_request_cancelled', handleFriendRequestCancelled);
      socket.off('friend_removed', handleFriendRemoved);
      socket.off('friend_request_seen', handleFriendRequestSeen);
      
      // Presence cleanup
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
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
    handleFriendRequestSeen,
    handleUserOnline,
    handleUserOffline,
  ]);

  // Reset fetch flag on disconnect
  useEffect(() => {
    if (!isConnected) {
      hasFetchedRef.current = false;
    }
  }, [isConnected]);

  return null;
}