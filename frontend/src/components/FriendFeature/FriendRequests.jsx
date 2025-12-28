// frontend/src/components/FriendFeature/FriendRequests.jsx
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import useFriendStore from "../../store/friendStore";
import useFriendActions from "../../hooks/useFriendActions";
import friendService from "../../services/friendService"; // 🔥 NEW

/**
 * FriendRequests Component - ✅ UPDATED WITH SEEN TRACKING
 * 
 * Changes:
 * - Dùng useFriendActions hook thay vì gọi store actions trực tiếp
 * - Dùng friendRequests thay vì requests (theo friendStore.js)
 * - Auto mark all as seen when component mounts
 * - Socket tự động sync qua useFriendSocket
 */
export default function FriendRequests({ currentUser, onUpdateCount }) {
  const { t } = useTranslation("friendFeature");

  // ============================================
  // GET STATE FROM STORE - ✅ UPDATED
  // ============================================

  const friendRequests = useFriendStore((state) => state.friendRequests);
  const friends = useFriendStore((state) => state.friends);
  const markAllRequestsAsSeen = useFriendStore((state) => state.markAllRequestsAsSeen); // 🔥 NEW
  
  // ============================================
  // GET ACTIONS FROM HOOK - ✅ NEW
  // ============================================
  
  const {
    loading,
    error,
    loadFriendsData,
    acceptFriendRequest,
    rejectFriendRequest
  } = useFriendActions();

  // ============================================
  // 🔥 NEW: AUTO MARK AS SEEN WHEN VIEWING
  // ============================================
  
  useEffect(() => {
    // Chỉ mark khi có unseen requests
    const unseenRequests = friendRequests.filter(r => !r.seenAt);
    
    if (unseenRequests.length === 0) {
      return;
    }

    console.log(`👁️ Marking ${unseenRequests.length} requests as seen...`);

    // Delay nhỏ để đảm bảo user thực sự xem
    const timer = setTimeout(async () => {
      try {
        // Call API to mark all as seen
        await friendService.markAllRequestsAsSeen();
        
        // Update local store
        markAllRequestsAsSeen();
        
        console.log('✅ All requests marked as seen');
      } catch (error) {
        console.error('❌ Failed to mark requests as seen:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [friendRequests, markAllRequestsAsSeen]);

  // ============================================
  // UPDATE PARENT COUNT
  // ============================================

  useEffect(() => {
    if (onUpdateCount) {
      onUpdateCount(friendRequests.length);
    }
  }, [friendRequests.length, onUpdateCount]);

  // ============================================
  // HELPER: CHECK IF ALREADY FRIEND
  // ============================================

  const isAlreadyFriend = (friendUid) => {
    return friends.some(friend => friend.uid === friendUid);
  };

  // ============================================
  // HANDLE ACCEPT - ✅ UPDATED
  // ============================================

  const handleAccept = async (friendUid) => {
    // Kiểm tra đã kết bạn chưa
    if (isAlreadyFriend(friendUid)) {
      alert(t("friendRequests.errors.alreadyFriendAlert"));
      await loadFriendsData(); // Force refresh
      return;
    }

    try {
      // ✅ Dùng hook action
      const request = friendRequests.find(r => r.uid === friendUid);
      await acceptFriendRequest(friendUid, request);
      
      console.log("✅ Friend request accepted, UI auto-updated");
      
      // Store và socket đã handle update, không cần reload!
    } catch (err) {
      console.error("Error accepting request:", err);
      
      const errorMsg = err.message || t("friendRequests.errors.acceptFailed");
      alert(errorMsg);
    }
  };

  // ============================================
  // HANDLE REJECT - ✅ UPDATED
  // ============================================

  const handleReject = async (friendUid) => {
    try {
      // ✅ Dùng hook action
      await rejectFriendRequest(friendUid);
      
      console.log("✅ Friend request rejected, UI auto-updated");
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert(t("friendRequests.errors.rejectFailed"));
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================

  if (loading && friendRequests.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // ============================================
  // RENDER: ERROR
  // ============================================

  if (error && friendRequests.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <svg
          className="w-12 h-12 mx-auto text-red-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <button
          onClick={() => loadFriendsData()}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          {t("friendList.retry") || "Try again"}
        </button>
      </div>
    );
  }

  // ============================================
  // RENDER: EMPTY STATE
  // ============================================

  if (friendRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <svg 
          className="w-16 h-16 mx-auto text-gray-300 mb-3" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>
        <p className="text-gray-500 text-sm">{t("friendRequests.empty")}</p>
      </div>
    );
  }

  // ============================================
  // RENDER: REQUEST LIST
  // ============================================

  return (
    <div className="space-y-2">
      {friendRequests.map(r => {
        const alreadyFriend = isAlreadyFriend(r.uid);
        
        return (
          <div 
            key={r._id || r.uid} 
            className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <img 
              src={r.avatar || "https://i.pravatar.cc/40"} 
              alt={r.nickname || r.uid} 
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
            />
            
            <div className="flex-1 ml-3">
              <p className="font-medium text-gray-900">
                {r.nickname || r.uid}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="font-medium text-gray-400">
                  {t("common.uid")}:
                </span>
                {r.uid}
              </p>
              
              {alreadyFriend && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">
                  {t("friendRequests.alreadyFriend")}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {alreadyFriend ? (
                <button 
                  onClick={() => handleReject(r.uid)} 
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {t("friendRequests.removeRequest")}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleAccept(r.uid)} 
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {t("friendRequests.accept")}
                  </button>
                  <button 
                    onClick={() => handleReject(r.uid)} 
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {t("friendRequests.reject")}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}