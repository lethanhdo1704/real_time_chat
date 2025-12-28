// frontend/src/components/Home/ContextPanel.jsx - MOBILE RESPONSIVE
import { useTranslation } from "react-i18next";
import FriendList from "../FriendFeature/FriendList";
import FriendRequests from "../FriendFeature/FriendRequests";
import AddFriend from "../FriendFeature/AddFriend";
import GroupList from "../FriendFeature/GroupList";

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
  // RENDER
  // ============================================

  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
      {/* Header with User Info */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shrink-0">
        {/* User Avatar & Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-white/30 shadow-lg">
              <img
                src={user.avatar || "https://i.pravatar.cc/48"}
                alt={user.nickname}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate text-sm">
              {user.nickname}
            </p>
            <p className="text-xs text-white/80 truncate">
              UID: {user.uid}
            </p>
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
  );
}

// ============================================
// SEARCH ICON
// ============================================

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}