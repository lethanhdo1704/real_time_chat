// frontend/src/hooks/useFriendSocket.js
import { useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext'; // ✅ NEW
import socketService from '../services/socketService';
import useFriendStore from '../store/friendStore';

/**
 * useFriendSocket Hook
 * 
 * Setup socket listeners for friend events
 * Connects socket events to friendStore
 * 
 * ✅ Use this in App.jsx or Home.jsx (setup once)
 */
export function useFriendSocket() {
  const { user } = useContext(AuthContext);
  const { socket, isConnected } = useSocket(); // ✅ NEW: Get socket from context
  
  // Get store actions
  const handleNewRequest = useFriendStore((state) => state.handleNewRequest);
  const handleRequestAccepted = useFriendStore((state) => state.handleRequestAccepted);
  const handleRequestRejected = useFriendStore((state) => state.handleRequestRejected);
  const handleUnfriended = useFriendStore((state) => state.handleUnfriended);

  useEffect(() => {
    if (!user || !isConnected) return; // ✅ Wait for socket to be connected

    // ============================================
    // SETUP SOCKET LISTENERS
    // ============================================

    // 🔔 New friend request received
    const onFriendRequest = (data) => {
      console.log('🔔 [Socket] Friend request received:', data);
      handleNewRequest(data.request);
    };

    // 🎉 Friend request accepted
    const onRequestAccepted = (data) => {
      console.log('🎉 [Socket] Friend request accepted:', data);
      handleRequestAccepted(data.friend);
    };

    // ❌ Friend request rejected
    const onRequestRejected = (data) => {
      console.log('❌ [Socket] Friend request rejected:', data);
      handleRequestRejected(data.friendUid);
    };

    // 💔 Unfriended by someone
    const onUnfriended = (data) => {
      console.log('💔 [Socket] Unfriended by:', data);
      handleUnfriended(data.friendUid);
    };

    // Register listeners
    socketService.on('friend:request', onFriendRequest);
    socketService.on('friend:accepted', onRequestAccepted);
    socketService.on('friend:rejected', onRequestRejected);
    socketService.on('friend:unfriended', onUnfriended);

    console.log('✅ Friend socket listeners registered');

    // ============================================
    // CLEANUP
    // ============================================

    return () => {
      socketService.off('friend:request', onFriendRequest);
      socketService.off('friend:accepted', onRequestAccepted);
      socketService.off('friend:rejected', onRequestRejected);
      socketService.off('friend:unfriended', onUnfriended);
      
      console.log('🧹 Friend socket listeners cleaned up');
    };
  }, [user, isConnected, handleNewRequest, handleRequestAccepted, handleRequestRejected, handleUnfriended]); // ✅ Add isConnected
}

export default useFriendSocket;