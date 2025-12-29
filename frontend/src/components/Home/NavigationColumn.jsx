// frontend/src/components/Home/NavigationColumn.jsx
import { useTranslation } from "react-i18next";

/**
 * NavigationColumn Component - Column 1 (64px width)
 * 
 * ✅ Icon-only navigation
 * ✅ Badge notifications
 * ✅ Settings button at bottom
 * ✅ Mobile optimized (min 48px touch targets)
 * ✅ Scrollable when content overflows
 * ✅ Logout always visible
 */
export default function NavigationColumn({ 
  activeTab, 
  onTabChange,
  unseenRequestCount = 0,
  onLogout,
  onSettings
}) {
  const { t } = useTranslation("home");

  const navItems = [
    { 
      id: 'friends', 
      icon: FriendsIcon, 
      label: t("home.tabs.friends"),
      badge: 0 
    },
    { 
      id: 'groups', 
      icon: GroupsIcon, 
      label: t("home.tabs.groups"),
      badge: 0 
    },
    { 
      id: 'requests', 
      icon: RequestsIcon, 
      label: t("home.tabs.requests"),
      badge: unseenRequestCount
    },
    { 
      id: 'add', 
      icon: AddFriendIcon, 
      label: t("home.tabs.add"),
      badge: 0 
    },
  ];

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
      {/* Scrollable Navigation Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col items-center min-h-0">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              relative w-12 h-12 rounded-xl flex items-center justify-center mb-2 shrink-0
              transition-all duration-200
              ${activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
              }
            `}
            style={{ 
              minWidth: '48px',
              minHeight: '48px',
              WebkitTapHighlightColor: 'transparent'
            }}
            title={item.label}
            aria-label={item.label}
          >
            <item.icon className="w-6 h-6" />
            
            {/* Badge */}
            {item.badge > 0 && (
              <span 
                className={`
                  absolute -top-1 -right-1 min-w-5 h-5 px-1
                  text-[10px] font-bold flex items-center justify-center
                  rounded-full border-2 border-white shadow-md
                  ${activeTab === item.id 
                    ? 'bg-white text-blue-600' 
                    : 'bg-red-500 text-white animate-pulse'
                  }
                `}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Fixed Bottom Actions - ALWAYS VISIBLE */}
      <div className="flex flex-col items-center py-4 border-t border-gray-200 shrink-0">
        {/* Settings Button */}
        <button
          onClick={onSettings}
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
          style={{ 
            minWidth: '48px',
            minHeight: '48px',
            WebkitTapHighlightColor: 'transparent'
          }}
          title={t("home.header.settings") || "Settings"}
          aria-label={t("home.header.settings") || "Settings"}
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          style={{ 
            minWidth: '48px',
            minHeight: '48px',
            WebkitTapHighlightColor: 'transparent'
          }}
          title={t("home.header.logout")}
          aria-label={t("home.header.logout")}
        >
          <LogoutIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// ICON COMPONENTS
// ============================================

function FriendsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function GroupsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function RequestsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function AddFriendIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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