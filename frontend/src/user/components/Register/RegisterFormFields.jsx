import { useTranslation } from "react-i18next";
import ReCAPTCHA from "react-google-recaptcha";
import EmailWithOTP from "../common/EmailWithOTP";
import OTPInput from "../common/OTPInput";
import PasswordInput from "../common/PasswordInput";
import ErrorMessage from "../common/ErrorMessage";

export default function RegisterFormFields({
  // Form values
  nickname,
  setNickname,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
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
}) {
  const { t } = useTranslation("register");

  return (
    <div className="space-y-5">
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
          maxLength={32}
          onChange={(e) => setNickname(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
        />
        <p className="mt-1 text-xs text-gray-500">
          {nickname.trim().length}/32 {t("validation.characters")}
        </p>
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
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
          onChange={(value) => setCaptcha(value)}
        />
      </div>
    </div>
  );
}