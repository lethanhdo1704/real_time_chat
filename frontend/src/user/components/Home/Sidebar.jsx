// frontend/src/components/Home/Sidebar.jsx
import { useTranslation } from "react-i18next";
import SidebarItem from "./SidebarItem";
import AddFriend from "../FriendFeature/AddFriend";
import FriendRequests from "../FriendFeature/FriendRequests";
import FriendList from "../FriendFeature/FriendList";
import GroupList from "../FriendFeature/GroupList";
import AvatarImage from "../common/AvatarImage";
import useFriendStore from "../../store/friendStore";

/**
 * Sidebar Component - Mobile-First Optimized (Pure Tailwind)
 * 
 * ✅ Better touch targets (min 44px)
 * ✅ Improved visual hierarchy
 * ✅ Smooth scrolling
 * ✅ Premium mobile design
 * 🔥 NEW: Auto-sync unseen count from store
 * 🔥 UPDATED: Using AvatarImage component for consistent avatar rendering
 */
export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  requestCount, // Deprecated - keeping for backward compatibility
  handleLogout,
  handleCopyUID,
  updateRequestCount,
  onSelectFriend,
  onSelectConversation,
  isMobile = false,
}) {
  const { t } = useTranslation("home");
  
  // 🔥 Get unseen count from store
  const unseenCount = useFriendStore((state) => state.unseenCount);

  return (
    <div className="w-full h-full flex flex-col bg-white shadow-2xl lg:shadow-xl lg:border-r border-gray-200">
      {/* Header - Premium gradient design */}
      <div className="p-5 lg:p-6 border-b border-gray-200 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* User info section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar with online status - Using AvatarImage component */}
            <AvatarImage
              avatar={user.avatar}
              nickname={user.nickname}
              avatarUpdatedAt={user.avatarUpdatedAt}
              size="lg"
              showOnlineStatus={true}
              isOnline={user.isOnline || true}
            />

            {/* User details */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-base mb-1">
                {user.nickname}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.uid);
                  handleCopyUID();
                }}
                className="flex items-center gap-2 text-xs text-white/90 hover:text-white transition-colors group"
                title={t("home.header.copyUID")}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '32px'
                }}
              >
                <span className="font-medium opacity-80 hidden sm:inline">
                  {t("home.header.uidLabel")}
                </span>
                <span className="truncate max-w-25 sm:max-w-35 bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {user.uid}
                </span>
                <svg
                  className="w-3.5 h-3.5 shrink-0 opacity-90 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Logout button - Better touch target */}
          <button
            onClick={handleLogout}
            className="p-3 rounded-xl hover:bg-white/20 active:bg-white/30 transition-all duration-200 active:scale-95 group shrink-0 backdrop-blur-sm"
            title={t("home.header.logout")}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <svg
              className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-200"
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

      {/* Navigation Tabs - Mobile optimized with better touch targets */}
      <div className="py-3 px-3 space-y-1 bg-linear-to-b from-gray-50 to-white border-b border-gray-100 shrink-0">
        <SidebarItem
          active={activeTab === "friends"}
          onClick={() => setActiveTab("friends")}
          icon={
            <svg
              className="w-5 h-5 shrink-0"
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
          }
          label={t("home.tabs.friends")}
        />

        <SidebarItem
          active={activeTab === "groups"}
          onClick={() => setActiveTab("groups")}
          icon={
            <svg
              className="w-5 h-5 shrink-0"
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
          }
          label={t("home.tabs.groups")}
        />

        <SidebarItem
          active={activeTab === "requests"}
          onClick={() => setActiveTab("requests")}
          icon={
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          }
          label={t("home.tabs.requests")}
          badge={unseenCount}
        />

        <SidebarItem
          active={activeTab === "add"}
          onClick={() => setActiveTab("add")}
          icon={
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          }
          label={t("home.tabs.add")}
        />
      </div>

      {/* Content Area - Optimized scrolling for mobile */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto bg-white"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* FRIENDS TAB */}
        {activeTab === "friends" && (
          <FriendList currentUser={user} onSelectFriend={onSelectFriend} />
        )}

        {/* GROUPS TAB */}
        {activeTab === "groups" && (
          <GroupList currentUser={user} onSelectRoom={onSelectConversation} />
        )}

        {/* REQUESTS TAB */}
        {activeTab === "requests" && (
          <FriendRequests
            currentUser={user}
            onUpdateCount={updateRequestCount}
          />
        )}

        {/* ADD FRIEND TAB */}
        {activeTab === "add" && (
          <AddFriend currentUser={user} />
        )}
      </div>
    </div>
  );
}