// frontend/src/components/Home/ContextPanel.jsx - FINAL VERSION
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import FriendList from "../FriendFeature/FriendList";
import FriendRequests from "../FriendFeature/FriendRequests";
import AddFriend from "../FriendFeature/AddFriend";
import GroupList from "../FriendFeature/GroupList";
import CopyToast from "./CopyToast";
import AvatarImage from "../common/AvatarImage";

export default function ContextPanel({ 
  activeTab,
  user,
  onSelectFriend,
  onSelectConversation,
  onUpdateRequestCount,
  onLogout
}) {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
  // MOBILE MENU ACTIONS
  // ============================================
  
  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMobileMenu(!showMobileMenu);
  };

  const handleSettings = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMobileMenu(false);
    navigate('/settings');
  };

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMobileMenu(false);
    if (onLogout) {
      onLogout();
    }
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
  // RENDER
  // ============================================

  return (
    <>
      <div className="w-full md:w-80 bg-white md:border-r border-gray-200 flex flex-col h-full min-h-0 shrink-0">
        
        {/* Header with User Info - Full width gradient */}
        <div 
          className="w-full border-b border-gray-200 shrink-0 relative z-50" 
          style={{
            background: 'linear-gradient(to right bottom, rgb(37, 99, 235), rgb(79, 70, 229), rgb(147, 51, 234))'
          }}
        >
          <div className="px-4 py-4">
            {/* User Avatar & Name */}
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar with Status - Using AvatarImage component */}
              <AvatarImage
                avatar={user.avatar}
                nickname={user.nickname}
                avatarUpdatedAt={user.avatarUpdatedAt}
                size="lg"
                showOnlineStatus={true}
                isOnline={user.isOnline || true}
              />
              
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate text-sm">
                  {user.nickname || 'Unknown User'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/80 truncate">
                    {t("home.header.uidLabel")} {user.uid || '---'}
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

              {/* Mobile Menu Button (visible only on mobile) */}
              <button
                onClick={handleMenuToggle}
                type="button"
                className="md:hidden shrink-0 bg-white/20 hover:bg-white/30 active:bg-white/40 p-2 rounded-lg transition-all relative z-50"
                aria-label="Menu"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <MenuIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Tab Title */}
            <h2 className="text-white text-lg font-bold">
              {getHeaderTitle()}
            </h2>
          </div>

          {/* Mobile Dropdown Menu */}
          {showMobileMenu && (
            <div className="md:hidden absolute top-full left-0 right-0 border-t border-white/20 bg-linear-to-b from-purple-600 to-purple-700 backdrop-blur-sm shadow-xl z-50">
              <button
                onClick={handleSettings}
                type="button"
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 active:bg-white/20 transition-colors flex items-center gap-3"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="font-medium">{t("home.header.settings") || "Settings"}</span>
              </button>
              <button
                onClick={handleLogout}
                type="button"
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 active:bg-white/20 transition-colors flex items-center gap-3 border-t border-white/20"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <LogoutIcon className="w-5 h-5" />
                <span className="font-medium">{t("home.header.logout") || "Logout"}</span>
              </button>
            </div>
          )}
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

      {/* Mobile Menu Overlay - Click outside to close */}
      {showMobileMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
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

function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}