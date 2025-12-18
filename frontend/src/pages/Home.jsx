// frontend/src/pages/Home.jsx
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChatWindow from "../components/Chat/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { getFriendsAndRequests } from "../services/friendService";

// Friend components
import AddFriend from "../components/FriendFeature/AddFriend";
import FriendRequests from "../components/FriendFeature/FriendRequests";
import FriendList from "../components/FriendFeature/FriendList";
import GroupList from "../components/FriendFeature/GroupList";

// Toast Component
function CopyToast({ show, onClose, message }) {
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
          <p className="text-sm font-medium">{message}</p>
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

// Sidebar Item Component
function SidebarItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
        transition-colors text-left
        ${active
          ? "bg-blue-100 text-blue-700"
          : "text-gray-700 hover:bg-gray-100"}
      `}
    >
      {icon}
      
      <span className="flex-1 text-sm font-medium">
        {label}
      </span>

      {badge > 0 && (
        <span className="min-w-4.5 h-4.5 px-1 text-[11px] font-bold
                         flex items-center justify-center
                         bg-red-500 text-white rounded-full">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export default function Home() {
  const { t } = useTranslation("home");
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("friends");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  
  // States cho chat
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">{t("home.loading")}</p>
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
    console.log('Updating request count:', count);
    setRequestCount(count);
  };

  // Handle selecting a friend for private chat
  const handleSelectFriend = (chatInfo) => {
    setSelectedChat({
      ...chatInfo,
      type: 'private'
    });
    setCurrentRoom(null);
  };

  // Handle selecting a group
  const handleSelectRoom = (room) => {
    setCurrentRoom(room);
    setSelectedChat(null);
  };

  // Fetch request count khi component mount
  useEffect(() => {
    if (user) {
      const fetchInitialCount = async () => {
        try {
          const data = await getFriendsAndRequests(user.uid);
          const count = (data.requests || []).length;
          console.log('Initial request count:', count);
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

      <div className="flex h-screen bg-gray-100 overflow-hidden min-h-0">
        {/* Copy Toast */}
        <CopyToast 
          show={showCopyToast} 
          onClose={() => setShowCopyToast(false)}
          message={t("home.toast.copiedUID")}
        />

        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="w-[320px] shrink-0 hidden lg:flex flex-col bg-white border-r border-gray-200 shadow-lg min-h-0">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 bg-linear-to-r from-blue-500 to-indigo-600 shrink-0">
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
                    title={t("home.header.copyUID")}
                  >
                    <span className="font-medium text-blue-200">{t("home.header.uidLabel")}</span>
                    <span className="truncate max-w-32">{user.uid}</span>
                    <svg className="w-3.5 h-3.5 shrink-0ity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors group shrink-0"
                title={t("home.header.logout")}
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

          {/* Vertical Menu Navigation */}
          <div className="px-2 py-3 space-y-1 bg-gray-50 border-b border-gray-200 shrink-0">
            <SidebarItem
              active={activeTab === "friends"}
              onClick={() => setActiveTab("friends")}
              icon={
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              label={t("home.tabs.friends")}
            />

            <SidebarItem
              active={activeTab === "groups"}
              onClick={() => setActiveTab("groups")}
              icon={
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              label={t("home.tabs.groups")}
            />

            <SidebarItem
              active={activeTab === "requests"}
              onClick={() => setActiveTab("requests")}
              icon={
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
              label={t("home.tabs.requests")}
              badge={requestCount}
            />

            <SidebarItem
              active={activeTab === "add"}
              onClick={() => setActiveTab("add")}
              icon={
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
              label={t("home.tabs.add")}
            />
          </div>

          {/* Content - Full Height */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50">
            {activeTab === "friends" && (
              <FriendList 
                currentUser={user} 
                onCopyUID={handleCopyUID}
                onSelectFriend={handleSelectFriend}
              />
            )}
            {activeTab === "groups" && (
              <GroupList 
                currentUser={user} 
                onSelectRoom={handleSelectRoom}
              />
            )}
            {activeTab === "requests" && (
              <FriendRequests 
                currentUser={user} 
                onUpdateCount={updateRequestCount}
              />
            )}
            {activeTab === "add" && (
              <AddFriend currentUser={user} />
            )}
          </div>
        </div>

        {/* Chat Window - Full width on mobile, fills remaining space on desktop */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {selectedChat?.type === 'private' ? (
            <ChatWindow
              receiverId={selectedChat.receiverId}
              receiverName={selectedChat.receiverName}
              receiverAvatar={selectedChat.receiverAvatar}
            />
          ) : currentRoom ? (
            <ChatWindow
              currentRoom={currentRoom}
              user={{
                uid: user.uid,
                nickname: user.nickname,
                avatar: user.avatar,
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-linear-to-br from-gray-50 to-blue-50">
              <div className="text-center px-4">
                <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  {t("home.welcome.title")}
                </h2>
                <p className="text-gray-500 mb-1">
                  {t("home.welcome.subtitle")}
                </p>
                <div className="flex flex-col items-center gap-2 mt-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{t("home.welcome.features.privateChat")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 4 0 014 0z" />
                    </svg>
                    <span>{t("home.welcome.features.groupChat")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}