// src/admin/pages/AdminNotFound.jsx
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation("adminnotfound");

  const handleGoHome = () => {
    // ✅ Redirect về user domain
    const userDomain = import.meta.env.VITE_USER_DOMAIN || "https://realtimechat.online";
    window.location.href = userDomain;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        
        {/* Glowing 404 */}
        <div className="mb-8 relative">
          <h1 className="text-9xl md:text-[12rem] font-bold bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse drop-shadow-2xl">
            {t("errorCode")}
          </h1>
          <div className="absolute inset-0 blur-3xl bg-linear-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50 animate-pulse"></div>
        </div>

        {/* Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
          {t("title")}
        </h2>

        <p className="text-lg md:text-xl text-slate-300 mb-12 leading-relaxed px-4">
          {t("description")}
        </p>

        {/* Home Button with hover effect */}
        <button
          onClick={handleGoHome}
          aria-label={t("button.ariaLabel")}
          className="inline-flex items-center gap-3 px-8 py-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          {t("button.text")}
        </button>

        {/* Animated decorative dots */}
        <div className="flex justify-center gap-2 mt-16">
          <span className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></span>
          <span className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-100"></span>
          <span className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-200"></span>
        </div>

      </div>

      {/* Corner decoration */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-tr from-purple-500/10 to-transparent rounded-tr-full"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-pink-500/10 to-transparent rounded-bl-full"></div>
      
    </div>
  );
}