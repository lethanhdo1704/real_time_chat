// frontend/src/pages/Home.jsx
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { getFriendsAndRequests } from "../services/friendService";

// Friend components
import AddFriend from "../components/FriendFeature/AddFriend";
import FriendRequests from "../components/FriendFeature/FriendRequests";
import FriendList from "../components/FriendFeature/FriendList";
import GroupList from "../components/FriendFeature/GroupList";

// Toast Component
function CopyToast({ show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed left-4 bottom-4 z-50 animate-slide-in">
      <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-64">
        <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium">Đã sao chép UID!</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("friends"); // friends / requests / add / groups
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCopyUID = () => {
    setShowCopyToast(true);
  };

  const updateRequestCount = (count) => {
    console.log('Updating request count:', count); // Debug log
    setRequestCount(count);
  };

  // Fetch request count khi component mount hoặc khi chuyển tab
  useEffect(() => {
    if (user) {
      const fetchInitialCount = async () => {
        try {
          const data = await getFriendsAndRequests(user.uid);
          const count = (data.requests || []).length;
          console.log('Initial request count:', count); // Debug log
          setRequestCount(count);
        } catch (err) {
          console.error('Error fetching initial request count:', err);
        }
      };
      fetchInitialCount();
    }
  }, [user]);

  return (
    <>
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      <div className="flex h-screen bg-gray-100">
        {/* Copy Toast */}
        <CopyToast show={showCopyToast} onClose={() => setShowCopyToast(false)} />

        {/* Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 bg-linear-to-r from-blue-500 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={user.avatar || "https://i.pravatar.cc/40"}
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{user.nickname}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.uid);
                      handleCopyUID();
                    }}
                    className="flex items-center gap-1.5 text-xs text-blue-100 hover:text-white transition-colors group"
                    title="Sao chép UID"
                  >
                    <span className="font-medium text-blue-200">UID:</span>
                    <span className="truncate max-w-32">{user.uid}</span>
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors group shrink-0"
                title="Đăng xuất"
              >
                <svg
                  className="w-5 h-5 text-white group-hover:text-red-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                activeTab === "friends"
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Bạn bè</span>
              </div>
              {activeTab === "friends" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                activeTab === "groups"
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Nhóm</span>
              </div>
              {activeTab === "groups" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                activeTab === "requests"
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {requestCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
                      {requestCount > 99 ? '99+' : requestCount}
                    </span>
                  )}
                </div>
                <span>Lời mời</span>
              </div>
              {activeTab === "requests" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                activeTab === "add"
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Thêm bạn</span>
              </div>
              {activeTab === "add" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {activeTab === "friends" && <FriendList currentUser={user} onCopyUID={handleCopyUID} />}
            {activeTab === "groups" && <GroupList currentUser={user} onSelectRoom={setCurrentRoom} />}
            {activeTab === "requests" && <FriendRequests currentUser={user} onUpdateCount={updateRequestCount} />}
            {activeTab === "add" && <AddFriend currentUser={user} />}
          </div>
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col">
          <ChatWindow
            currentRoom={currentRoom}
            user={{
              uid: user.uid,
              nickname: user.nickname,
              avatar: user.avatar,
            }}
          />
        </div>
      </div>
    </>
  );
}