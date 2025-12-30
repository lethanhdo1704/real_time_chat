// frontend/src/components/Settings/SettingsHeader.jsx
import { useTranslation } from "react-i18next";

export default function SettingsHeader() {
  const { t } = useTranslation("settings");

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("settings.header.title")}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("settings.header.subtitle")}
        </p>
      </div>
    </div>
  );
}