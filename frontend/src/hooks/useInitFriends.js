// frontend/src/hooks/useInitFriends.js
import { useEffect, useRef } from 'react';
import useFriendActions from './useFriendActions';
import useFriendSocket from './useFriendSocket';

/**
 * useInitFriends Hook
 * 
 * Initializes friend data and socket listeners on app mount:
 * - Loads friends data ONCE per session
 * - Sets up friend socket listeners
 * - Handles rate limit errors with retry
 * - Cleans up on unmount
 * 
 * @param {Object} user - Current user object
 */
export default function useInitFriends(user) {
  const hasInitialized = useRef(false);
  const retryTimeoutRef = useRef(null);
  const { loadFriendsData } = useFriendActions();
  
  // ✅ Setup friend socket listeners (always active when component is mounted)
  useFriendSocket();

  useEffect(() => {
    // ✅ Only load when user exists and hasn't been initialized
    if (!user?.uid) {
      // Reset flag when user logs out
      hasInitialized.current = false;
      return;
    }

    if (hasInitialized.current) {
      console.log('✅ [useInitFriends] Already initialized, skipping');
      return;
    }

    // Mark as initialized immediately to prevent duplicate calls
    hasInitialized.current = true;
    
    console.log('🚀 [useInitFriends] Loading friends data for user:', user.uid);
    
    loadFriendsData().catch(err => {
      console.error('❌ [useInitFriends] Failed to load friends:', err);
      
      // ✅ Handle rate limit error (429)
      if (err.status === 429) {
        console.log('⏰ [useInitFriends] Rate limited, will retry in 30 seconds...');
        
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 [useInitFriends] Retrying to load friends data...');
          hasInitialized.current = false; // Reset to allow retry
          
          loadFriendsData().catch(retryErr => {
            console.error('❌ [useInitFriends] Retry failed:', retryErr);
            hasInitialized.current = false; // Allow manual retry
          });
        }, 30000); // 30 seconds
      } else {
        // Reset flag on other errors to allow manual retry
        console.log('🔄 [useInitFriends] Resetting flag to allow retry');
        hasInitialized.current = false;
      }
    });

    // ✅ Cleanup
    return () => {
      if (retryTimeoutRef.current) {
        console.log('🧹 [useInitFriends] Clearing retry timeout');
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [user?.uid, loadFriendsData]); // ✅ Added loadFriendsData to deps

  return null;
}