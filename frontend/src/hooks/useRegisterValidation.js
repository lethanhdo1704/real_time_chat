// frontend/src/hooks/useRegisterValidation.js

export function useRegisterValidation(t) {
  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!regex.test(email.trim())) {
      return t("validation.emailMustBeGmail");
    }
    return "";
  };

  const validateNickname = (name) => {
    const n = name.trim();
    if (n.length < 2 || n.length > 20) {
      return t("validation.nicknameLength");
    }
    return "";
  };

  const validatePassword = (pw) => {
    if (pw.length < 6) {
      return t("validation.passwordMinLength");
    }
    if (!/[A-Za-z]/.test(pw)) {
      return t("validation.passwordMustHaveLetter");
    }
    if (!/[0-9]/.test(pw)) {
      return t("validation.passwordMustHaveNumber");
    }
    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (password !== confirmPassword) {
      return t("validation.passwordNotMatch");
    }
    return "";
  };

  const validateOTP = (otp) => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      return t("validation.pleaseEnterFullOtp");
    }
    return "";
  };

  return {
    validateEmail,
    validateNickname,
    validatePassword,
    validateConfirmPassword,
    validateOTP,
  };
}