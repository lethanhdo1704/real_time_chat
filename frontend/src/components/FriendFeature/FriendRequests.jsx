// frontend/src/components/FriendFeature/FriendRequests.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFriendsAndRequests, acceptFriendRequest, rejectFriendRequest } from "../../services/friendService";

export default function FriendRequests({ currentUser, onUpdateCount }) {
  const { t } = useTranslation("friendFeature");
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // ✅ Không cần truyền currentUser.uid, backend lấy từ JWT
      const data = await getFriendsAndRequests();
      setRequests(data.requests || []);
      setFriends(data.friends || []);
      
      // Cập nhật số lượng lời mời cho parent component
      if (onUpdateCount) {
        onUpdateCount((data.requests || []).length);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequests([]);
      setFriends([]);
      if (onUpdateCount) {
        onUpdateCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const isAlreadyFriend = (friendUid) => {
    return friends.some(friend => friend.uid === friendUid);
  };

  const handleAccept = async (friendUid) => {
    // Kiểm tra đã kết bạn chưa
    if (isAlreadyFriend(friendUid)) {
      alert(t("friendRequests.errors.alreadyFriendAlert"));
      fetchRequests(); // Refresh để cập nhật UI
      return;
    }

    try {
      // ✅ Chỉ truyền friendUid, backend lấy userUid từ JWT
      await acceptFriendRequest(friendUid);
      fetchRequests();
    } catch (err) {
      console.error("Error accepting request:", err);
      alert(t("friendRequests.errors.acceptFailed"));
    }
  };

  const handleReject = async (friendUid) => {
    try {
      // ✅ Chỉ truyền friendUid
      await rejectFriendRequest(friendUid);
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert(t("friendRequests.errors.rejectFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-sm">{t("friendRequests.empty")}</p>
        </div>
      )}
      
      {requests.map(r => {
        const alreadyFriend = isAlreadyFriend(r.uid);
        
        return (
          <div key={r._id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <img 
              src={r.avatar || "https://i.pravatar.cc/40"} 
              alt={r.nickname || r.uid} 
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
            />
            <div className="flex-1 ml-3">
              <p className="font-medium text-gray-900">{r.nickname || r.uid}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="font-medium text-gray-400">{t("common.uid")}:</span>
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
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    {t("friendRequests.accept")}
                  </button>
                  <button 
                    onClick={() => handleReject(r.uid)} 
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
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