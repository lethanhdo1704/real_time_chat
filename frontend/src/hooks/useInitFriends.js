// frontend/src/hooks/useInitFriends.js
import { useEffect, useRef } from 'react';
import useFriendActions from './useFriendActions';
import useFriendSocket from './useFriendSocket';
import useFriendStore from '../store/friendStore';

export default function useInitFriends(user) {
  const hasInitialized = useRef(false);
  const retryTimeoutRef = useRef(null);
  const { loadFriendsData } = useFriendActions();
  const { isCacheValid } = useFriendStore();
  
  // ✅ Setup socket listeners
  useFriendSocket();

  useEffect(() => {
    // ✅ Only load ONCE per session
    if (user?.uid && !hasInitialized.current) {
      hasInitialized.current = true;
      
      console.log('🚀 [useInitFriends] Loading friends data for user:', user.uid);
      
      loadFriendsData().catch(err => {
        console.error('❌ [useInitFriends] Failed to load friends:', err);
        
        // ✅ If 429, retry after 30 seconds
        if (err.status === 429) {
          console.log('⏰ Will retry in 30 seconds...');
          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Retrying to load friends data...');
            hasInitialized.current = false; // Reset to allow retry
            loadFriendsData().catch(e => {
              console.error('❌ Retry failed:', e);
            });
          }, 30000); // 30 seconds
        } else {
          // Reset flag on other errors to allow manual retry
          hasInitialized.current = false;
        }
      });
    }

    // ✅ Cleanup
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (!user?.uid) {
        hasInitialized.current = false;
      }
    };
  }, [user?.uid]);

  return null;
}