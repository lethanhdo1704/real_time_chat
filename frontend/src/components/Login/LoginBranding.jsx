// frontend/src/components/Login/LoginBranding.jsx
import { useTranslation } from "react-i18next";

/**
 * Component hiển thị branding và features của app
 * Chỉ hiển thị trên desktop (md:flex)
 */
export default function LoginBranding() {
  const { t } = useTranslation("login");

  const features = [
    { key: "realtime", icon: CheckIcon },
    { key: "security", icon: CheckIcon },
    { key: "ui", icon: CheckIcon },
  ];

  return (
    <div className="hidden md:flex flex-col justify-center items-center bg-gray-50 text-gray-900 p-6 border-r border-gray-200">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6 inline-flex items-center justify-center w-50 h-50">
          <img
            src="/Logo_chat.svg"
            alt="Chat Logo"
            className="w-50 h-50 drop-shadow-lg"
          />
        </div>

        {/* App Title */}
        <h1 className="text-4xl font-bold mb-4 tracking-tight drop-shadow-lg text-gray-900">
          {t("appTitle")}
        </h1>
        <p className="text-xl text-gray-600 max-w-xs mx-auto leading-relaxed font-medium">
          {t("appSubtitle")}
        </p>

        {/* Features List */}
        <div className="mt-10 space-y-4 text-left max-w-xs mx-auto">
          {features.map(({ key, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3 text-gray-700">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-base font-medium">
                {t(`features.${key}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Checkmark Icon Component
function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}