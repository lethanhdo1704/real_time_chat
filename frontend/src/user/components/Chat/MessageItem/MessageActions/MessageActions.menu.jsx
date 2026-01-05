import { CopyIcon, ForwardIcon, EditIcon, RecallIcon, HideIcon } from "./MessageActions.icons";

/**
 * MenuItem Component
 */
export const MenuItem = ({ icon, label, onClick, danger = false }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
        danger ? "hover:bg-red-50 text-red-600" : "hover:bg-gray-100 text-gray-700"
      }`}
    >
      <span className={danger ? "text-red-500" : "text-gray-500"}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

/**
 * Actions Dropdown Menu
 */
export const ActionsMenu = ({
  menuRef,
  isMe,
  isFailed,
  menuPosition,
  isOneToOneChat,
  canRecall,
  canHide,
  onAction,
  onCopy,
  onForward,
  onEdit,
  onRecall,
  onHide,
  t,
}) => {
  return (
    <div
      ref={menuRef}
      className={`
        absolute ${isMe ? "right-0" : "left-0"} 
        ${menuPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"}
        bg-white rounded-lg shadow-xl border border-gray-200 
        py-1 min-w-40 z-50
      `}
      style={{
        animation: "scaleIn 0.15s ease-out",
      }}
    >
      {/* Copy */}
      <MenuItem
        icon={<CopyIcon />}
        label={t("actions.copy") || "Copy"}
        onClick={() => onAction(onCopy)}
      />

      {/* Forward */}
      <MenuItem
        icon={<ForwardIcon />}
        label={t("actions.forward") || "Forward"}
        onClick={() => onAction(onForward)}
      />

      {/* Edit (Only for own messages) */}
      {isMe && !isFailed && (
        <MenuItem
          icon={<EditIcon />}
          label={t("actions.edit") || "Edit"}
          onClick={() => onAction(onEdit)}
        />
      )}

      {/* Divider */}
      {(isMe || (!isMe && isOneToOneChat && canHide)) && (
        <div className="h-px bg-gray-200 my-1" />
      )}

      {/* Recall (Only for own messages) */}
      {isMe && canRecall && (
        <MenuItem
          icon={<RecallIcon />}
          label={t("actions.recallButton") || "Thu hồi"}
          onClick={onRecall}
          danger
        />
      )}

      {/* Hide (Only for other's messages in 1-1 chat) */}
      {!isMe && isOneToOneChat && canHide && (
        <MenuItem
          icon={<HideIcon />}
          label={t("actions.hideButton") || "Gỡ tin nhắn"}
          onClick={onHide}
          danger
        />
      )}
    </div>
  );
};
