// frontend/src/hooks/useInitFriends.js
import { useEffect, useRef } from 'react';
import useFriendActions from './useFriendActions';
import useFriendSocket from './useFriendSocket';
import friendService from '../services/friendService'; // 🔥 NEW
import useFriendStore from '../store/friendStore'; // 🔥 NEW

/**
 * useInitFriends Hook
 * 
 * Initializes friend data and socket listeners on app mount:
 * - Loads friends data ONCE per session
 * - Loads unseen request count
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
  const setUnseenCount = useFriendStore(state => state.setUnseenCount); // 🔥 NEW
  
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
    
    // 🔥 Load both friends data and unseen count
    Promise.all([
      loadFriendsData(),
      friendService.getUnseenRequestCount()
    ])
      .then(([_, unseenData]) => {
        console.log('✅ [useInitFriends] Loaded unseen count:', unseenData.count);
        setUnseenCount(unseenData.count);
      })
      .catch(err => {
        console.error('❌ [useInitFriends] Failed to load friends:', err);
        
        // ✅ Handle rate limit error (429)
        if (err.status === 429) {
          console.log('⏰ [useInitFriends] Rate limited, will retry in 30 seconds...');
          
          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 [useInitFriends] Retrying to load friends data...');
            hasInitialized.current = false; // Reset to allow retry
            
            Promise.all([
              loadFriendsData(),
              friendService.getUnseenRequestCount()
            ])
              .then(([_, unseenData]) => {
                setUnseenCount(unseenData.count);
              })
              .catch(retryErr => {
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
  }, [user?.uid, loadFriendsData, setUnseenCount]); // 🔥 Added setUnseenCount

  return null;
}