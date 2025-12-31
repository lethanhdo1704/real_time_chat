// frontend/src/components/Settings/SettingsHeader.jsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function SettingsHeader() {
  const { t } = useTranslation("settings");
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label={t("settings.header.back")}
          >
            <ArrowLeft className="w-10 h-10 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {t("settings.header.title")}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t("settings.header.subtitle")}
            </p>
          </div>
          <div className="w-10 shrink-0"></div>
        </div>
      </div>
    </div>
  );
}