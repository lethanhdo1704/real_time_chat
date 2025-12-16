// frontend/src/components/FriendFeature/GroupList.jsx
import { useEffect, useState } from "react";

export default function GroupList({ currentUser, setCurrentRoom }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Mock data - Replace with actual API call
  const fetchGroups = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const data = await getGroups(currentUser.uid);
      const mockGroups = [
        {
          _id: "group1",
          name: "Nhóm Học Tập",
          avatar: "https://i.pravatar.cc/60?img=10",
          lastMessage: "Ai làm bài tập chưa?",
          lastMessageTime: "10:30",
          unreadCount: 3,
          memberCount: 5
        },
        {
          _id: "group2",
          name: "Gia Đình",
          avatar: "https://i.pravatar.cc/60?img=20",
          lastMessage: "Tối nay ăn gì?",
          lastMessageTime: "Hôm qua",
          unreadCount: 0,
          memberCount: 4
        },
        {
          _id: "group3",
          name: "Dự Án ABC",
          avatar: "https://i.pravatar.cc/60?img=30",
          lastMessage: "Meeting lúc 2h chiều",
          lastMessageTime: "14:00",
          unreadCount: 7,
          memberCount: 8
        }
      ];
      setGroups(mockGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      // TODO: Replace with actual API call
      // await createGroup(currentUser.uid, newGroupName);
      console.log("Creating group:", newGroupName);
      setNewGroupName("");
      setShowCreateModal(false);
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const handleSelectGroup = (group) => {
    setCurrentRoom({
      id: group._id,
      name: group.name,
      type: "group",
      avatar: group.avatar
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Create Group Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Tạo nhóm mới
      </button>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Tạo nhóm chat mới</h3>
            <input
              type="text"
              placeholder="Nhập tên nhóm..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroupName("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
              >
                Tạo nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-sm">Chưa có nhóm chat</p>
          <p className="text-gray-400 text-xs mt-1">Tạo nhóm để trò chuyện cùng nhiều người</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group._id}
              onClick={() => handleSelectGroup(group)}
              className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                {group.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {group.unreadCount > 9 ? '9+' : group.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 ml-3 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900 truncate">{group.name}</p>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{group.lastMessageTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 truncate">{group.lastMessage}</p>
                  <span className="text-xs text-gray-400 shrink-0 ml-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {group.memberCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}