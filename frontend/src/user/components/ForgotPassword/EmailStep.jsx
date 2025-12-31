import { useTranslation } from "react-i18next";
import ErrorMessage from "../common/ErrorMessage";
import SubmitButton from "../common/SubmitButton";

export default function EmailStep({
  email,
  setEmail,
  onSubmit,
  error,
  loading
}) {
  const { t } = useTranslation("forgotPassword");

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Error Message */}
      <ErrorMessage message={error} type="error" />

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("form.email.label")}
        </label>
        <input
          type="email"
          placeholder={t("form.email.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
        />
      </div>

      {/* Submit Button */}
      <SubmitButton
        isLoading={loading}
        loadingText={t("buttons.sending")}
      >
        {t("buttons.sendOTP")}
      </SubmitButton>
    </form>
  );
}