// frontend/src/components/Settings/SuccessToast.jsx
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

export default function SuccessToast({ show }) {
  const { t } = useTranslation("settings");

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <Check className="w-5 h-5" />
        <span className="font-medium">{t("settings.toast.success")}</span>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}