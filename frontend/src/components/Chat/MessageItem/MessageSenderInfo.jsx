// frontend/src/components/Chat/MessageItem/MessageSenderInfo.jsx
export default function MessageSenderInfo({ name, avatar }) {
  return (
    <div className="flex items-center gap-2 mb-1 px-1">
      <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden shrink-0">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          name[0]?.toUpperCase() || "?"
        )}
      </div>
      <span className="text-xs font-medium text-gray-600">{name}</span>
    </div>
  );
}