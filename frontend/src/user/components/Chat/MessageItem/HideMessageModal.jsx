// frontend/src/components/Chat/MessageItem/HideMessageModal.jsx
import { useTranslation } from "react-i18next";

export default function HideMessageModal({ isOpen, onClose, onConfirm }) {
  const { t } = useTranslation("chat");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-9998 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Icon */}
          <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("hide.title") || "Ẩn tin nhắn này?"}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("hide.description") || 
                "Tin nhắn này sẽ bị ẩn khỏi đoạn chat của bạn. Người gửi vẫn có thể thấy tin nhắn này và không được thông báo."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 space-y-2">
            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all active:scale-[0.98] shadow-sm"
            >
              {t("hide.confirm") || "Ẩn tin nhắn"}
            </button>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-all active:scale-[0.98]"
            >
              {t("hide.cancel") || "Hủy"}
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}