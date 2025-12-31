// frontend/src/components/Login/LoginFields.jsx
import { useTranslation } from "react-i18next";
import PasswordInput from "../common/PasswordInput";

/**
 * Component chứa các input fields của login form
 * - Email input
 * - Password input (sử dụng PasswordInput component)
 * - Remember me checkbox
 * - Forgot password link
 */
export default function LoginFields({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  togglePasswordVisibility,
  rememberMe,
  setRememberMe,
  clearError,
}) {
  const { t } = useTranslation("login");

  return (
    <div className="space-y-3.5">
      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("login.email")}
        </label>
        <input
          type="email"
          placeholder={t("login.emailPlaceholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
        />
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("login.password")}
        </label>
        <PasswordInput
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError();
          }}
          placeholder={t("login.passwordPlaceholder")}
          showPassword={showPassword}
          onToggleVisibility={togglePasswordVisibility}
          required
        />
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-gray-600">{t("login.rememberMe")}</span>
        </label>
        <a
          href="/ForgotPassword"
          className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          {t("login.forgotPassword")}
        </a>
      </div>
    </div>
  );
}