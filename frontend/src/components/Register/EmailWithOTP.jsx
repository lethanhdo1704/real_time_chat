// frontend/src/components/Register/EmailWithOTP.jsx
import { useTranslation } from "react-i18next";

export default function EmailWithOTP({
  email,
  onEmailChange,
  onSendOTP,
  loading,
  timer,
  formatTimer,
}) {
  const { t } = useTranslation("register");

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("email")}
      </label>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={onEmailChange}
          required
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
        />
        <button
          type="button"
          onClick={onSendOTP}
          disabled={loading || timer > 0}
          className="px-5 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {timer > 0 ? formatTimer(timer) : t("sendOtp")}
        </button>
      </div>
    </div>
  );
}