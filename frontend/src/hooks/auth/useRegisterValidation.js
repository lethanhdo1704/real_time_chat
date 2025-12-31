// frontend/src/hooks/useRegisterValidation.js

export function useRegisterValidation(t) {
  // Helper function để normalize (giống backend)
  const normalizeNickname = (nickname) => {
    return nickname.trim().replace(/\s+/g, " ");
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!regex.test(email.trim())) {
      return t("validation.emailMustBeGmail");
    }
    return "";
  };

  const validateNickname = (name) => {
    const n = normalizeNickname(name); // ← Normalize như backend
    if (n.length < 3 || n.length > 32) {
      return t("validation.nicknameLength");
    }
    // Optional: Check có ít nhất 1 chữ/số
    if (!/[\p{L}\p{N}]/u.test(n)) {
      return t("validation.nicknameMustHaveAlphanumeric"); 
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
    normalizeNickname, // ← Export để dùng khi submit
    validateEmail,
    validateNickname,
    validatePassword,
    validateConfirmPassword,
    validateOTP,
  };
}