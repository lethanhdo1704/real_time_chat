// frontend/src/components/Home/SidebarItem.jsx

/**
 * SidebarItem Component
 * 
 * Simple menu item for sidebar navigation tabs
 * (Friends, Groups, Requests, Add)
 * 
 * Note: Conversation items now use ConversationItem.jsx
 */
export default function SidebarItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-3 px-4 py-2.5 rounded-none
        transition-all duration-200 text-left
        ${
          active
            ? "bg-linear-to-r from-blue-600 to-blue-500 text-white border-l-4 border-l-white"
            : "text-gray-700 hover:bg-gray-100 border-l-4 border-l-transparent"
        }
      `}
    >
      <div
        className={`
        shrink-0 transition-transform
        ${active ? "scale-110" : "group-hover:scale-105"}
      `}
      >
        {icon}
      </div>

      <span
        className={`
        flex-1 text-sm font-semibold
        ${active ? "text-white" : "text-gray-800"}
      `}
      >
        {label}
      </span>

      {/* Badge - Messenger style */}
      {badge > 0 && (
        <span
          className={`
          min-w-5.5 h-5.5 px-1.5 text-[11px] font-bold
          flex items-center justify-center rounded-full
          ${
            active
              ? "bg-white text-blue-600"
              : "bg-red-500 text-white animate-pulse"
          }
        `}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}