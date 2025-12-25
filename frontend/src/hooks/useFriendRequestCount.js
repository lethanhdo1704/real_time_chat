// frontend/src/hooks/useFriendRequestCount.js
import { useEffect } from "react";
import useFriendStore from "../store/friendStore"; // ✅ NEW

/**
 * useFriendRequestCount Hook - FIXED
 * 
 * ✅ Now reads from store instead of fetching API
 * ✅ No more duplicate requests
 * ✅ Real-time updates via store
 * 
 * @param {object} user - Current user object
 * @returns {object} { count, setCount, loading }
 */
export function useFriendRequestCount(user) {
  // ✅ Read from store (no API call)
  const count = useFriendStore((state) => state.unreadCount);
  const loading = useFriendStore((state) => state.loading);
  const fetchFriends = useFriendStore((state) => state.fetchFriends);

  // ============================================
  // FETCH ON MOUNT (IF NOT ALREADY LOADED)
  // ============================================

  useEffect(() => {
    if (user?.uid) {
      // ✅ Store handles caching - won't refetch if already loaded
      fetchFriends();
    }
  }, [user?.uid, fetchFriends]);

  // ============================================
  // RETURN
  // ============================================

  return {
    count,
    loading,
    // Note: setCount is now handled by store actions (acceptRequest, rejectRequest, etc.)
  };
}