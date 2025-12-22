// frontend/src/components/FriendFeature/FriendList.jsx
import { useEffect, useState } from "react";
import { getFriendsAndRequests } from "../../services/friendService";
import { useTranslation } from "react-i18next";

export default function FriendList({
  currentUser,
  onCopyUID,
  onSelectFriend,
}) {
  const { t } = useTranslation("friendFeature");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriendsAndRequests();
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      fetchFriends();
    }
  }, [currentUser?.uid]);

  const handleCopyUID = (e, uid) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uid);
    if (onCopyUID) onCopyUID();
  };

  const handleSelectFriend = (friend) => {
    if (onSelectFriend) {
      onSelectFriend({
        uid: friend.uid,
        _id: friend._id,
        nickname: friend.nickname,
        avatar: friend.avatar,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Sort alphabetically
  const sortedFriends = [...friends].sort((a, b) => {
    const nameA = a.nickname || a.uid || "";
    const nameB = b.nickname || b.uid || "";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-2">
      {friends.length === 0 && (
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <p className="text-gray-500 text-sm">{t("friendList.empty.title")}</p>
          <p className="text-gray-400 text-xs mt-1">
            {t("friendList.empty.subtitle")}
          </p>
        </div>
      )}

      {sortedFriends.map((f) => {
        return (
          <div
            key={f._id}
            onClick={() => handleSelectFriend(f)}
            className="flex items-center p-3 border rounded-lg bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
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
              <p className="font-medium text-gray-900 truncate mb-1">
                {f.nickname || f.uid}
              </p>

              <button
                onClick={(e) => handleCopyUID(e, f.uid)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors group"
                title={t("friendList.copyUID")}
              >
                <span className="font-medium text-gray-400">
                  {t("common.uid")}:
                </span>
                <span className="truncate max-w-35">{f.uid}</span>
                <svg
                  className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            <div className="shrink-0 ml-2">
              <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}