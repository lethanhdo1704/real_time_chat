import { useTranslation } from "react-i18next";
import React from "react";

export default function RecallMessageModal({ isOpen, onClose, onConfirm }) {
  const { t } = useTranslation("chat");
  const [selectedOption, setSelectedOption] = React.useState("everyone");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedOption);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-9998 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-135 animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 pt-5 pb-4 text-center">
            <h3 className="text-[17px] font-semibold text-gray-900 leading-snug">
              {t("recall.title")}
            </h3>
            <p className="text-[13px] text-gray-500 mt-1">
              {t("recall.subtitle")}
            </p>
          </div>

          {/* Options */}
          <div className="px-2 pb-2">
            {/* Option 1: Recall for Everyone */}
            <button
              onClick={() => setSelectedOption("everyone")}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                {/* Radio Button */}
                <div className="shrink-0 w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                  {selectedOption === "everyone" && (
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-gray-900">
                    {t("recall.forEveryone.title")}
                  </p>
                  <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">
                    {t("recall.forEveryone.description")}
                  </p>
                </div>
              </div>
            </button>

            {/* Option 2: Recall for Me */}
            <button
              onClick={() => setSelectedOption("me")}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                {/* Radio Button */}
                <div className="shrink-0 w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                  {selectedOption === "me" && (
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-gray-900">
                    {t("recall.forMe.title")}
                  </p>
                  <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">
                    {t("recall.forMe.description")}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 mx-2" />

          {/* Footer - Action Buttons */}
          <div className="p-2 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg hover:bg-gray-50 text-[15px] text-gray-700 font-medium transition-colors active:bg-gray-100"
            >
              {t("recall.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-[15px] text-white font-medium transition-colors active:bg-blue-800"
            >
              {t("recall.confirm")}
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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}