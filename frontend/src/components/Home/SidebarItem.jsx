// frontend/src/components/Home/SidebarItem.jsx

export default function SidebarItem({ icon, label, active, onClick, badge }) {
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