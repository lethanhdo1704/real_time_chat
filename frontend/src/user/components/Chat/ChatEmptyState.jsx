// frontend/src/components/Chat/ChatEmptyState.jsx
import { useTranslation } from "react-i18next";

export default function ChatEmptyState() {
  const { t } = useTranslation("home");

  return (
    <div className="flex flex-col items-center justify-center h-full bg-linear-to-br from-gray-50 to-blue-50">
      <div className="text-center px-4">
        <svg
          className="w-24 h-24 mx-auto text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          {t("home.welcome.title")}
        </h2>
        <p className="text-gray-500">{t("home.welcome.subtitle")}</p>
      </div>
    </div>
  );
}
