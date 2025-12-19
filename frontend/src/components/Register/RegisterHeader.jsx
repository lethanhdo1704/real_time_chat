import { useTranslation } from "react-i18next";

export default function RegisterHeader() {
  const { t } = useTranslation("register");
  
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h2>
      <p className="text-gray-600">{t("subtitle")}</p>
    </div>
  );
}