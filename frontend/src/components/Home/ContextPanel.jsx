// frontend/src/components/Home/ContextPanel.jsx - FULL i18n SUPPORT
import { useState } from "react";
import { useTranslation } from "react-i18next";
import FriendList from "../FriendFeature/FriendList";
import FriendRequests from "../FriendFeature/FriendRequests";
import AddFriend from "../FriendFeature/AddFriend";
import GroupList from "../FriendFeature/GroupList";
import CopyToast from "./CopyToast";

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
      case 'friends': return t("home.tabs.friends");
      case 'groups': return t("home.tabs.groups");
      case 'requests': return t("home.tabs.requests");
      case 'add': return t("home.tabs.add");
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
      <div className="w-full md:w-80 bg-white md:border-r border-gray-200 flex flex-col h-full min-h-0 shrink-0">
        
        {/* Header with User Info - Full width gradient */}
        <div 
          className="w-full border-b border-gray-200 shrink-0" 
          style={{
            background: 'linear-gradient(to right bottom, rgb(37, 99, 235), rgb(79, 70, 229), rgb(147, 51, 234))'
          }}
        >
          <div className="px-4 py-4">
            {/* User Avatar & Name */}
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar with Status */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden ring-2 ring-white/30 shadow-lg">
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
                    {t("home.header.uidLabel")} {user.uid}
                  </p>
                  <button
                    onClick={handleCopyUID}
                    type="button"
                    className="shrink-0 bg-white/20 hover:bg-white/30 active:bg-white/40 p-1.5 rounded transition-all cursor-pointer"
                    title={t("home.header.copyUID")}
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
        </div>

        {/* Search Bar */}
        {activeTab !== 'add' && (
          <div className="px-4 py-4 border-b border-gray-200 shrink-0 bg-white">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("home.search.placeholder")}
                className="w-full bg-gray-100 text-gray-900 pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
              />
            </div>
          </div>
        )}

        {/* Content Area - Scrollable */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto bg-white"
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
            <GroupList 
              currentUser={user} 
              setCurrentRoom={onSelectConversation} 
            />
          )}
          
          {activeTab === 'requests' && (
            <FriendRequests
              currentUser={user}
              onUpdateCount={onUpdateRequestCount}
            />
          )}
          
          {activeTab === 'add' && (
            <AddFriend currentUser={user} />
          )}
        </div>
      </div>

      {/* Copy Toast */}
      <CopyToast
        show={showCopyToast}
        onClose={() => setShowCopyToast(false)}
        message={t("home.toast.copiedUID")}
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