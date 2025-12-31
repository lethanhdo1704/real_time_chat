// frontend/src/hooks/useFriendActions.js
import { useState } from 'react';
import friendService from '../services/friendService';
import useFriendStore from '../store/friendStore';

/**
 * Hook để xử lý các actions với friends
 * 
 * ⚠️ IMPORTANT NOTES:
 * - loadFriendsData() CHỈ dùng cho manual refresh (pull-to-refresh, retry button)
 * - Auto-fetch lúc init được handle bởi useFriendSocket khi socket connected
 * - KHÔNG gọi loadFriendsData() trong useEffect tự động
 */
export default function useFriendActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    addSentRequest,
    removeSentRequest,
    removeFriendRequest,
    addFriend,
    removeFriend,
    setFriendsData,
    isCacheValid,
  } = useFriendStore();

  // ============================================
  // LOAD FRIENDS DATA - ⚠️ FOR MANUAL REFRESH ONLY
  // ============================================
  const loadFriendsData = async (force = false) => {
    // ✅ Check cache validity (unless forced)
    if (!force && isCacheValid()) {
      console.log('✅ [useFriendActions] Using cached friends data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 [useFriendActions] Fetching fresh friends data...');
      const data = await friendService.getFriendsList();
      setFriendsData(data);
      console.log('✅ [useFriendActions] Friends data loaded successfully');
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Không thể tải danh sách bạn bè';
      setError(errorMsg);
      console.error('❌ [useFriendActions] Load friends error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SEND FRIEND REQUEST
  // ============================================
  const sendFriendRequest = async (friendUid) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await friendService.sendFriendRequest(friendUid);
      
      addSentRequest({
        uid: friendUid,
      });
      
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Không thể gửi lời mời kết bạn';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ACCEPT FRIEND REQUEST
  // ============================================
  const acceptFriendRequest = async (friendUid, friendData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await friendService.acceptFriendRequest(friendUid);
      
      removeFriendRequest(friendUid);
      addFriend(friendData || { uid: friendUid });
      
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Không thể chấp nhận lời mời';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // REJECT FRIEND REQUEST
  // ============================================
  const rejectFriendRequest = async (friendUid) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await friendService.rejectFriendRequest(friendUid);
      
      removeFriendRequest(friendUid);
      
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Không thể từ chối lời mời';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CANCEL FRIEND REQUEST
  // ============================================
  const cancelFriendRequest = async (friendUid) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await friendService.cancelFriendRequest(friendUid);
      
      removeSentRequest(friendUid);
      
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Không thể hủy lời mời';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UNFRIEND
  // ============================================
  const unfriend = async (friendUid) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await friendService.unfriend(friendUid);
      
      removeFriend(friendUid);
      
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Không thể hủy kết bạn';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CHECK FRIEND STATUS
  // ============================================
  const checkFriendStatus = async (friendUid) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await friendService.getFriendStatus(friendUid);
      return response.status;
    } catch (err) {
      const errorMsg = err.message || 'Không thể kiểm tra trạng thái';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    loadFriendsData, // ⚠️ FOR MANUAL REFRESH ONLY
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    unfriend,
    checkFriendStatus
  };
}