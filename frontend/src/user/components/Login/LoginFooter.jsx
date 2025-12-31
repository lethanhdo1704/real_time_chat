// frontend/src/user/components/Login/LoginFooter.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * LoginFooter Component
 * 
 * Footer for Login/Register pages with:
 * - Privacy Policy (opens in new tab)
 * - Cookie Policy (opens in new tab)
 * - Terms of Service (opens in new tab)
 * - Language Selector
 */
export default function LoginFooter() {
  const { t, i18n } = useTranslation("login");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const currentLanguage = i18n.language || "vi";

  const languages = [
    { code: "vi", name: "Tiếng Việt" },
    { code: "en", name: "English" },
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("lang", langCode);
    setIsLanguageOpen(false);
  };

  const handleLinkClick = (type) => {
    // Open policy pages in new tab
    window.open(`/policy/${type}`, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="w-full py-6 px-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        {/* Links Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-4">
          {/* Privacy Policy */}
          <button
            onClick={() => handleLinkClick("privacy")}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors cursor-pointer"
          >
            {t("footer.privacy") || "Chính sách quyền riêng tư"}
          </button>

          <span className="text-gray-300 hidden sm:inline">•</span>

          {/* Cookie Policy */}
          <button
            onClick={() => handleLinkClick("cookies")}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors cursor-pointer"
          >
            {t("footer.cookies") || "Chính sách cookie"}
          </button>

          <span className="text-gray-300 hidden sm:inline">•</span>

          {/* Terms */}
          <button
            onClick={() => handleLinkClick("terms")}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors cursor-pointer"
          >
            {t("footer.terms") || "Điều khoản"}
          </button>

          <span className="text-gray-300 hidden sm:inline">•</span>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <span>
                {languages.find((l) => l.code === currentLanguage)?.name ||
                  "Tiếng Việt"}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isLanguageOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Language Dropdown */}
            {isLanguageOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsLanguageOpen(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-40 z-20">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`
                        w-full px-4 py-2 text-left text-sm flex items-center gap-3
                        transition-colors
                        ${
                          currentLanguage === lang.code
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span>{lang.name}</span>
                      {currentLanguage === lang.code && (
                        <svg
                          className="w-4 h-4 ml-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Real Time Chat
        </div>
      </div>
    </footer>
  );
}