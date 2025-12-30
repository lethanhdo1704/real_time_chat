// frontend/src/components/Settings/SecurityNotice.jsx
import { useTranslation } from "react-i18next";

export default function SecurityNotice() {
  const { t } = useTranslation("settings");

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex gap-3">
        <div className="shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">i</span>
          </div>
        </div>
        <div>
          <h3 className="font-medium text-blue-900 mb-1">
            {t("settings.security.title")}
          </h3>
          <p className="text-sm text-blue-700">
            {t("settings.security.description")}
          </p>
        </div>
      </div>
    </div>
  );
}