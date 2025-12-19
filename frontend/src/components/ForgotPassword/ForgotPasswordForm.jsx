// frontend/src/components/ForgotPassword/ForgotPasswordForm.jsx
import { Link } from "react-router-dom"; // ← Bỏ useEffect
import { useTranslation } from "react-i18next";

import ForgotPasswordHeader from "./ForgotPasswordHeader";
import EmailStep from "./EmailStep";
import ResetPasswordStep from "./ResetPasswordStep";

import useForgotPassword from "../../hooks/useForgotPassword";
import useOTPInput from "../../hooks/useOTPInput";

export default function ForgotPasswordForm() {
  const { t } = useTranslation("forgotPassword");
  
  // Custom hooks
  const {
    email,
    setEmail,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    step,
    setStep,
    timer, // ← Timer đã có countdown logic bên trong hook
    otpMessage,
    successMessage,
    error,
    loading,
    handleSendOTP,
    handleResetPassword,
    handleResendOTP,
  } = useForgotPassword();

  const {
    otp,
    otpRefs,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    focusFirstInput,
    getOtpValue,
    resetOtp,
  } = useOTPInput();

  const onSendOTP = (e) => {
    handleSendOTP(e, focusFirstInput);
  };

  const onResetPassword = (e) => {
    handleResetPassword(e, getOtpValue());
  };

  const onResendOTP = () => {
    handleResendOTP(() => {
      resetOtp();
      focusFirstInput();
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-10 lg:p-12">
          <ForgotPasswordHeader step={step} />

          {step === 1 ? (
            <EmailStep
              email={email}
              setEmail={setEmail}
              onSubmit={onSendOTP}
              error={error}
              loading={loading}
            />
          ) : (
            <ResetPasswordStep
              email={email}
              otp={otp}
              otpRefs={otpRefs}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onSubmit={onResetPassword}
              onBack={() => setStep(1)}
              onResendOTP={onResendOTP}
              timer={timer}
              error={error}
              otpMessage={otpMessage}
              successMessage={successMessage}
              loading={loading}
              handleOtpChange={handleOtpChange}
              handleOtpKeyDown={handleOtpKeyDown}
              handleOtpPaste={handleOtpPaste}
            />
          )}

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {t("footer.rememberPassword")}{" "}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                {t("footer.loginLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}