// frontend/src/components/Home/ContextPanel.jsx - MOBILE RESPONSIVE
import { useState } from "react";
import { useTranslation } from "react-i18next";
import FriendList from "../FriendFeature/FriendList";
import FriendRequests from "../FriendFeature/FriendRequests";
import AddFriend from "../FriendFeature/AddFriend";
import GroupList from "../FriendFeature/GroupList";
import CopyToast from "./CopyToast";

/**
 * ContextPanel Component - Responsive Panel
 * 
 * Desktop (≥ 768px): Fixed width 320px (Column 2)
 * Mobile (< 768px): Full width, no fixed width constraint
 * 
 * Content modes:
 * - friends: FriendList
 * - groups: GroupList
 * - requests: FriendRequests
 * - add: AddFriend
 */
export default function ContextPanel({ 
  activeTab,
  user,
  onSelectFriend,
  onSelectConversation,
  onUpdateRequestCount
}) {
  const { t } = useTranslation("home");
  const [showCopyToast, setShowCopyToast] = useState(false);

  // ============================================
  // COPY UID TO CLIPBOARD
  // ============================================
  
  const handleCopyUID = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Fallback method for copying
    const textArea = document.createElement("textarea");
    textArea.value = user.uid;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setShowCopyToast(true);
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
    
    document.body.removeChild(textArea);
  };

  // ============================================
  // GET HEADER TITLE
  // ============================================
  
  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'friends': return t("home.tabs.friends") || "Bạn bè";
      case 'groups': return t("home.tabs.groups") || "Nhóm";
      case 'requests': return t("home.tabs.requests") || "Lời mời";
      case 'add': return t("home.tabs.add") || "Thêm bạn";
      default: return '';
    }
  };

  // ============================================
  // GET USER INITIALS
  // ============================================
  
  const getUserInitials = (nickname) => {
    if (!nickname) return "?";
    return nickname.trim()[0].toUpperCase();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
        {/* Header with User Info */}
        <div className="p-4 border-b border-gray-200 shrink-0" style={{
          background: 'linear-gradient(to bottom right, rgb(37, 99, 235), rgb(79, 70, 229), rgb(147, 51, 234))'
        }}>
          {/* User Avatar & Name */}
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar with Status */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden ring-2 ring-white/30 shadow-lg">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getUserInitials(user.nickname)
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-sm">
                {user.nickname}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white/80 truncate">
                  UID: {user.uid}
                </p>
                <button
                  onClick={handleCopyUID}
                  type="button"
                  className="shrink-0 bg-white/20 hover:bg-white/30 active:bg-white/40 p-1.5 rounded transition-all cursor-pointer"
                  title="Copy UID"
                >
                  <CopyIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Title */}
          <h2 className="text-white text-lg font-bold">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Search Bar (only for friends/groups/requests) */}
        {activeTab !== 'add' && (
          <div className="p-4 border-b border-gray-200 shrink-0">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("home.search.placeholder") || "Tìm kiếm..."}
                className="w-full bg-gray-100 text-gray-900 pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
              />
            </div>
          </div>
        )}

        {/* Content Area - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto bg-gray-50"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {activeTab === 'friends' && (
            <FriendList 
              currentUser={user} 
              onSelectFriend={onSelectFriend} 
            />
          )}
          
          {activeTab === 'groups' && (
            <div className="p-4">
              <GroupList 
                currentUser={user} 
                setCurrentRoom={onSelectConversation} 
              />
            </div>
          )}
          
          {activeTab === 'requests' && (
            <div className="p-4">
              <FriendRequests
                currentUser={user}
                onUpdateCount={onUpdateRequestCount}
              />
            </div>
          )}
          
          {activeTab === 'add' && (
            <div className="p-4">
              <AddFriend currentUser={user} />
            </div>
          )}
        </div>
      </div>

      {/* Copy Toast */}
      <CopyToast
        show={showCopyToast}
        onClose={() => setShowCopyToast(false)}
        message={t("home.copied") || "Đã sao chép UID"}
      />
    </>
  );
}

// ============================================
// ICONS
// ============================================

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CopyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}