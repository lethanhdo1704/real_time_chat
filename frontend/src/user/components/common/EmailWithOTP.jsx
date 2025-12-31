// frontend/src/components/Register/EmailWithOTP.jsx
import { useTranslation } from "react-i18next";
import CountdownTimer from "../common/CountdownTimer";

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
          className="px-5 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t("sending")}
            </span>
          ) : (
            <CountdownTimer
              seconds={timer}
              format={formatTimer}
              idleLabel={t("sendOtp")}
            />
          )}
        </button>
      </div>
    </div>
  );
}