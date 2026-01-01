// frontend/src/hooks/useFriendRequestCount.js
import { useEffect, useMemo } from "react";
import useFriendStore from "../../store/friendStore";
import useFriendActions from "./useFriendActions";

/**
 * useFriendRequestCount Hook - ✅ UPDATED TO MATCH NEW STRUCTURE
 * 
 * Changes:
 * - Removed unreadCount from store (doesn't exist in new friendStore.js)
 * - Calculate count from friendRequests.length
 * - Dùng useFriendActions.loadFriendsData thay vì store.fetchFriends
 * - Real-time updates via store + socket
 * 
 * @param {object} user - Current user object
 * @returns {object} { count, loading }
 */
export function useFriendRequestCount(user) {
  // ============================================
  // GET STATE FROM STORE - ✅ UPDATED
  // ============================================
  
  // ✅ friendRequests instead of unreadCount
  const friendRequests = useFriendStore((state) => state.friendRequests);
  
  // ============================================
  // GET ACTIONS FROM HOOK - ✅ NEW
  // ============================================
  
  const { loading, loadFriendsData } = useFriendActions();

  // ============================================
  // CALCULATE COUNT - ✅ NEW
  // ============================================
  
  const count = useMemo(() => {
    return friendRequests.length;
  }, [friendRequests.length]);

  return {
    count,
    loading,
    // Note: setCount is now handled by store actions via useFriendActions
    // (acceptFriendRequest, rejectFriendRequest, etc.)
  };
}