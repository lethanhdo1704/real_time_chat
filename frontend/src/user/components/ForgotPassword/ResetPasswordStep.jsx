import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ErrorMessage from "../common/ErrorMessage";
import OTPInput from "../common/OTPInput";
import PasswordInput from "../common/PasswordInput";
import SubmitButton from "../common/SubmitButton";
import CountdownTimer from "../common/CountdownTimer";

export default function ResetPasswordStep({
  email,
  otp,
  otpRefs,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  onBack,
  onResendOTP,
  timer,
  error,
  otpMessage,
  successMessage,
  loading,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
}) {
  const { t } = useTranslation("forgotPassword");

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl animate-pulse">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">{successMessage}</p>
            <p className="text-xs mt-1">{t("messages.redirecting")}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <ErrorMessage message={error} type="error" />}

      {/* OTP Success Message */}
      {otpMessage && !successMessage && (
        <ErrorMessage message={otpMessage} type="success" />
      )}

      {/* Email Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <p className="text-sm text-gray-600">
          {t("messages.emailDisplay")} <span className="font-semibold text-gray-900">{email}</span>
        </p>
      </div>

      {/* OTP Input with Timer */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("form.otp.label")}
          </label>
          {timer > 0 && (
            <span className="text-sm text-gray-500">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
        
        <OTPInput
          otp={otp}
          otpRefs={otpRefs}
          onOtpChange={handleOtpChange}
          onOtpKeyDown={handleOtpKeyDown}
          onOtpPaste={handleOtpPaste}
          disabled={!!successMessage}
        />

        {/* Resend OTP */}
        {timer === 0 && !successMessage && (
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={onResendOTP}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 transition-colors"
            >
              {t("form.otp.resendButton")}
            </button>
          </div>
        )}
      </div>

      {/* New Password */}
      <PasswordInput
        label={t("form.newPassword.label")}
        placeholder={t("form.newPassword.placeholder")}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        disabled={!!successMessage}
      />

      {/* Confirm Password */}
      <PasswordInput
        label={t("form.confirmPassword.label")}
        placeholder={t("form.confirmPassword.placeholder")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={!!successMessage}
      />

      {/* Submit Button */}
      <SubmitButton
        isLoading={loading}
        disabled={!!successMessage}
        loadingText={t("buttons.processing")}
      >
        {successMessage ? t("buttons.success") : t("buttons.resetPassword")}
      </SubmitButton>

      {/* Back Button */}
      {!successMessage && (
        <button
          type="button"
          onClick={onBack}
          className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm font-medium transition-colors hover:underline"
        >
          {t("buttons.back")}
        </button>
      )}
    </form>
  );
}