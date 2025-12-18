// frontend/src/components/Home/Sidebar.jsx
import { useTranslation } from "react-i18next";
import SidebarItem from "./SidebarItem";
import AddFriend from "../FriendFeature/AddFriend";
import FriendRequests from "../FriendFeature/FriendRequests";
import FriendList from "../FriendFeature/FriendList";
import GroupList from "../FriendFeature/GroupList";

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  requestCount,
  handleLogout,
  handleCopyUID,
  handleSelectFriend,
  handleSelectRoom,
  updateRequestCount
}) {
  const { t } = useTranslation("home");

  return (
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
                <svg className="w-3.5 h-3.5 shrink-0 opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
}