// frontend/src/components/Home/BottomNavigation.jsx
import { useTranslation } from "react-i18next";

/**
 * BottomNavigation Component - Mobile Navigation Bar
 * 
 * ✅ Fixed at bottom of screen
 * ✅ 4 main tabs with icons
 * ✅ Badge notifications
 * ✅ Only visible on mobile (< 768px)
 */
export default function BottomNavigation({ 
  activeTab, 
  onTabChange,
  unseenRequestCount = 0,
}) {
  const { t } = useTranslation("home");

  const tabs = [
    { 
      id: 'friends', 
      icon: FriendsIcon, 
      label: t("home.tabs.friends") || "Bạn bè",
      badge: 0 
    },
    { 
      id: 'groups', 
      icon: GroupsIcon, 
      label: t("home.tabs.groups") || "Nhóm",
      badge: 0 
    },
    { 
      id: 'requests', 
      icon: RequestsIcon, 
      label: t("home.tabs.requests") || "Lời mời",
      badge: unseenRequestCount
    },
    { 
      id: 'add', 
      icon: AddFriendIcon, 
      label: t("home.tabs.add") || "Thêm bạn",
      badge: 0 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      {/* Safe area for iPhone bottom notch */}
      <div className="pb-safe">
        <div className="flex justify-around items-center h-16">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center flex-1 h-full
                transition-colors duration-200
                ${activeTab === tab.id 
                  ? 'text-blue-600' 
                  : 'text-gray-500'
                }
              `}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={tab.label}
            >
              <div className="relative">
                <tab.icon className="w-6 h-6" />
                
                {/* Badge for notifications */}
                {tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              
              <span className="text-[11px] mt-1 font-medium truncate max-w-15">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ICON COMPONENTS
// ============================================

function FriendsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function GroupsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function RequestsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function AddFriendIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}