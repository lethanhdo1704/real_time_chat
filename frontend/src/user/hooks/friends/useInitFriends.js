// frontend/src/hooks/friends/useInitFriends.js - FIXED VERSION
import { useEffect, useRef } from 'react';
import useFriendSocket from '../socket/useFriendSocket';
import useFriendActions from './useFriendActions';
import useFriendStore from '../../store/friendStore';

/**
 * Hook to initialize friend system
 * 
 * 🔥 FIXED APPROACH:
 * 1. Fetch friends IMMEDIATELY on mount (don't wait for socket)
 * 2. Setup socket listeners for realtime updates
 * 3. Use cache to avoid redundant fetches
 */
export default function useInitFriends(user) {
  const hasInitialized = useRef(false);
  const { loadFriendsData, loading } = useFriendActions();
  const isCacheValid = useFriendStore((state) => state.isCacheValid);
  
  // ============================================
  // 🔥 FIX: FETCH IMMEDIATELY ON MOUNT
  // ============================================
  useEffect(() => {
    if (!user?.uid) {
      console.log('⏭️ [useInitFriends] No user, skipping init');
      return;
    }

    // ✅ Skip if already initialized OR cache is valid
    if (hasInitialized.current || isCacheValid()) {
      console.log('✅ [useInitFriends] Already initialized or cache valid, skipping');
      return;
    }

    console.log('🚀 [useInitFriends] Fetching friends immediately...');
    hasInitialized.current = true;
    
    // 🔥 Fetch friends ASAP - don't wait for socket
    loadFriendsData().catch((error) => {
      console.error('❌ [useInitFriends] Failed to fetch friends:', error);
      hasInitialized.current = false; // Allow retry
    });
  }, [user?.uid, isCacheValid, loadFriendsData]);

  // ============================================
  // Setup socket listeners (runs in parallel)
  // ============================================
  useFriendSocket();

  return { loading };
}