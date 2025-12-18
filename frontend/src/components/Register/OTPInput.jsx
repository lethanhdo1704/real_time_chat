// frontend/src/components/Register/OTPInput.jsx
import { useTranslation } from "react-i18next";

export default function OTPInput({
  otp,
  otpRefs,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
}) {
  const { t } = useTranslation("register");

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("otpCode")}
      </label>
      <div className="flex gap-2 justify-center">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (otpRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => onOtpChange(index, e.target.value)}
            onKeyDown={(e) => onOtpKeyDown(index, e)}
            onPaste={index === 0 ? onOtpPaste : undefined}
            required
            className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
          />
        ))}
      </div>
    </div>
  );
}