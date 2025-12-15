import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import "../styles/Auth.base.css";
import "../styles/register.css";

export default function Register() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 ô OTP
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpMessage, setOtpMessage] = useState("");

  // Toggle password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, sendOTP } = useContext(AuthContext);
  const navigate = useNavigate();

  // Refs cho 6 ô OTP
  const otpRefs = useRef([]);

  // =====================
  // VALIDATE
  // =====================
  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!regex.test(email.trim())) return "Email phải là Gmail (@gmail.com)";
    return "";
  };
  const validateNickname = (name) => {
    const n = name.trim();
    if (n.length < 2 || n.length > 20) return "Biệt danh phải từ 2–20 ký tự";
    return "";
  };
  const validatePassword = (pw) => {
    if (pw.length < 6) return "Mật khẩu phải từ 6 ký tự";
    if (!/[A-Za-z]/.test(pw)) return "Mật khẩu phải có chữ";
    if (!/[0-9]/.test(pw)) return "Mật khẩu phải có số";
    return "";
  };

  // =====================
  // SEND OTP
  // =====================
  const handleSendOTP = async () => {
    setError("");
    setOtpMessage("");
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    try {
      setLoading(true);
      await sendOTP(email);
      setOtpSent(true);
      setTimer(300);
      setOtpMessage("OTP đã gửi đến Gmail của bạn (hợp lệ 5 phút)");
      
      // Focus vào ô OTP đầu tiên
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      console.error("Send OTP error:", err.response?.data || err);
      setError(err.response?.data?.error || "Không thể gửi OTP");
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // HANDLE OTP INPUT
  // =====================
  const handleOtpChange = (index, value) => {
    // Chỉ cho phép số
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Chỉ lấy 1 ký tự cuối
    setOtp(newOtp);

    // Auto focus sang ô tiếp theo
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace: xóa và quay lại ô trước
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    // Arrow keys navigation
    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    while (newOtp.length < 6) newOtp.push("");
    setOtp(newOtp);

    // Focus vào ô cuối cùng có giá trị
    const lastIndex = Math.min(pastedData.length, 5);
    otpRefs.current[lastIndex]?.focus();
  };

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // =====================
  // REGISTER
  // =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!captcha) return setError("Vui lòng xác thực reCAPTCHA");

    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    const nickErr = validateNickname(nickname);
    if (nickErr) return setError(nickErr);

    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);

    if (password !== confirmPassword) return setError("Mật khẩu nhập lại không khớp");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) return setError("Vui lòng nhập đủ 6 số OTP");

    try {
      setLoading(true);
      await register({ nickname, email, password, otp: otpValue });
      navigate("/login");
    } catch (err) {
      console.error("Register error:", err.response?.data || err);
      setError(err.response?.data?.error || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Email */}
        <input
          type="email"
          placeholder="Gmail (@gmail.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Send OTP */}
        <button
          type="button"
          onClick={handleSendOTP}
          disabled={loading || timer > 0}
        >
          {timer > 0 ? `Gửi lại sau ${formatTimer(timer)}` : "Gửi OTP"}
        </button>

        {/* OTP Success Message */}
        {otpMessage && <p className="info">{otpMessage}</p>}

        {/* 6 OTP Input Boxes */}
        {otpSent && (
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
                required
              />
            ))}
          </div>
        )}

        {/* Nickname */}
        <input
          type="text"
          placeholder="Biệt danh (2–20 ký tự)"
          value={nickname}
          maxLength={20}
          onChange={(e) => setNickname(e.target.value)}
          required
        />

        {/* Password */}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-eye"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "👁️" : "🙈"}
          </span>
        </div>

        {/* Confirm Password */}
        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span
            className="toggle-eye"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? "👁️" : "🙈"}
          </span>
        </div>

        {/* reCAPTCHA */}
        <ReCAPTCHA
          sitekey="6LesOigsAAAAAMK4CosQAZeI_oK27NRjjJsITMVj"
          onChange={(value) => setCaptcha(value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng ký..." : "Register"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}