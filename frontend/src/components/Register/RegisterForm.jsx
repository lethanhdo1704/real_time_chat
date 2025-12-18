// frontend/src/components/Register/RegisterForm.jsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import ErrorMessage from "./ErrorMessage";
import EmailWithOTP from "./EmailWithOTP";
import OTPInput from "./OTPInput";
import PasswordInput from "./PasswordInput";

export default function RegisterForm({
  // Form values
  nickname,
  setNickname,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  captcha,
  setCaptcha,
  
  // OTP
  otp,
  otpRefs,
  otpSent,
  otpMessage,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  handleSendOTP,
  
  // Timer
  timer,
  formatTimer,
  
  // States
  error,
  sendingOTP,
  submitting,
  
  // Submit
  onSubmit,
}) {
  const { t } = useTranslation("register");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-10 lg:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h2>
            <p className="text-gray-600">{t("subtitle")}</p>
          </div>

          <form onSubmit={onSubmit} autoComplete="off" className="space-y-5">
            {/* Error Message */}
            <ErrorMessage message={error} type="error" />

            {/* Email + Send OTP */}
            <EmailWithOTP
              email={email}
              onEmailChange={(e) => setEmail(e.target.value)}
              onSendOTP={handleSendOTP}
              loading={sendingOTP}
              timer={timer}
              formatTimer={formatTimer}
            />

            {/* OTP Success Message */}
            <ErrorMessage message={otpMessage} type="success" />

            {/* OTP Input Boxes */}
            {otpSent && (
              <OTPInput
                otp={otp}
                otpRefs={otpRefs}
                onOtpChange={handleOtpChange}
                onOtpKeyDown={handleOtpKeyDown}
                onOtpPaste={handleOtpPaste}
              />
            )}

            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("nickname")}
              </label>
              <input
                type="text"
                placeholder={t("nicknamePlaceholder")}
                value={nickname}
                maxLength={20}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
              />
            </div>

            {/* Password */}
            <PasswordInput
              label={t("password")}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Confirm Password */}
            <PasswordInput
              label={t("confirmPassword")}
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey="6LesOigsAAAAAMK4CosQAZeI_oK27NRjjJsITMVj"
                onChange={(value) => setCaptcha(value)}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("registering")}
                </span>
              ) : (
                t("registerButton")
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {t("haveAccount")}{" "}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                {t("loginNow")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}