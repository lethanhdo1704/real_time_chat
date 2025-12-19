// Thêm prop disabled vào component OTPInput hiện tại
export default function OTPInput({
  otp,
  otpRefs,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  disabled = false // ← thêm prop này
}) {
  return (
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
          disabled={disabled} // ← sử dụng prop
          required
          className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white disabled:opacity-50"
        />
      ))}
    </div>
  );
}