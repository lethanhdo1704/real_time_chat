// frontend/src/components/FriendFeature/FriendList.jsx
import { useEffect, useState } from "react";
import { getFriendsAndRequests } from "../../services/friendService";

export default function FriendList({ currentUser, onCopyUID }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriendsAndRequests(currentUser.uid);
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleCopyUID = (uid) => {
    navigator.clipboard.writeText(uid);
    if (onCopyUID) {
      onCopyUID(); // Trigger toast in parent
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
      {friends.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-500 text-sm">Chưa có bạn bè</p>
          <p className="text-gray-400 text-xs mt-1">Hãy thêm bạn bè để trò chuyện</p>
        </div>
      )}
      
      {friends.map((f) => (
        <div 
          key={f._id} 
          className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all"
        >
          <div className="relative shrink-0">
            <img
              src={f.avatar || "https://i.pravatar.cc/40"}
              alt={f.nickname || f.uid}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 ml-3 min-w-0">
            <p className="font-medium text-gray-900 truncate">{f.nickname || f.uid}</p>
            <button
              onClick={() => handleCopyUID(f.uid)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors group"
              title="Sao chép UID"
            >
              <span className="font-medium text-gray-400">UID:</span>
              <span className="truncate max-w-35">{f.uid}</span>
              <svg className="w-3.5 h-3.5 shrink-0 opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            title="Nhắn tin"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}