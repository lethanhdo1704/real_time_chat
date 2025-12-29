// frontend/src/hooks/useInitFriends.js
import { useEffect, useRef } from 'react';
import useFriendActions from './useFriendActions';
import useFriendSocket from './useFriendSocket';
import friendService from '../services/friendService'; // 🔥 NEW
import useFriendStore from '../store/friendStore'; // 🔥 NEW

export default function useInitFriends(user) {
  const initFriendsOnce = useFriendStore(s => s.initFriendsOnce);
  const { loadFriendsData } = useFriendActions();

  // socket chỉ setup 1 lần khi component mount
  useFriendSocket();

  useEffect(() => {
    if (!user?.uid) return;

    initFriendsOnce(
      loadFriendsData,
      friendService.getUnseenRequestCount
    );
  }, [user?.uid]); // ✅ CHỈ user.uid
}
