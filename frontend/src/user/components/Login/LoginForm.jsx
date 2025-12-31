// frontend/src/components/Login/LoginForm.jsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import LoginFields from "./LoginFields";
import ErrorMessage from "../common/ErrorMessage";
import SubmitButton from "../common/SubmitButton";

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  togglePasswordVisibility,
  rememberMe,
  setRememberMe,
  error,
  loading,
  clearError,
  handleSubmit,
}) {
  const { t } = useTranslation("login");

  return (
    <div className="flex items-center justify-center p-3 lg:p-5 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-5 lg:p-8 border border-gray-100 my-auto">
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mb-3 inline-flex items-center justify-center w-14 h-14 bg-linear-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold mb-1.5 text-gray-900">
            {t("login.title")}
          </h2>
          <p className="text-sm text-gray-600">{t("login.subtitle")}</p>
        </div>

        {/* Error */}
        {error && <ErrorMessage message={error} />}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <LoginFields
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            togglePasswordVisibility={togglePasswordVisibility}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            clearError={clearError}
          />

          {/* Submit */}
          <SubmitButton isLoading={loading} loadingText={t("login.loggingIn")}>
            {t("login.loginButton")}
          </SubmitButton>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">{t("login.or")}</span>
          </div>
        </div>

        {/* Register */}
        <div className="text-center">
          <p className="text-gray-600 mb-2.5 text-sm">{t("login.noAccount")}</p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-2
                       border-2 border-indigo-600 text-indigo-600 font-semibold
                       rounded-xl hover:bg-indigo-50 transition-all
                       transform hover:scale-[1.02] active:scale-[0.98]"
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            {t("login.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
