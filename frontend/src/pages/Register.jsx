import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";       // 🟢 Import reCAPTCHA
import "../styles/Auth.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");

  const [captcha, setCaptcha] = useState("");          // 🟢 Lưu token captcha

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const validatePassword = (pw) => {
    if (pw.length < 6) return "Mật khẩu phải từ 6 ký tự";
    if (!/[A-Za-z]/.test(pw)) return "Mật khẩu phải có chữ";
    if (!/[0-9]/.test(pw)) return "Mật khẩu phải có số";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captcha) {
      setError("Vui lòng xác thực reCAPTCHA");
      return;
    }

    const pwCheck = validatePassword(password);
    if (pwCheck) {
      setPasswordError(pwCheck);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      await register(username, email, password, captcha); // gửi captcha lên server
      navigate("/login");
    } catch (err) {
      console.error("Register error:", err.response?.data || err);
      setError(err.response?.data?.error || "Server error");
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>

      {error && <p className="error">{error}</p>}
      {passwordError && <p className="error">{passwordError}</p>}

      <form onSubmit={handleSubmit} autoComplete="off">
        
        {/* Username */}
        <input
          type="text"
          name="name"
          placeholder="Tên người dùng"
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Email */}
        <input
          type="email"
          name="username"
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password */}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="new-password"
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            required
          />
          <span className="toggle-eye" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "👁️" : "🙈"}
          </span>
        </div>

        {/* Confirm Password */}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="new-confirm-password"
            placeholder="Confirm Password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError("");
            }}
            required
          />
          <span className="toggle-eye" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "👁️" : "🙈"}
          </span>
        </div>

        {/* 🟢 Google reCAPTCHA */}
        <ReCAPTCHA
          sitekey="6LesOigsAAAAAMK4CosQAZeI_oK27NRjjJsITMVj"
          onChange={(value) => setCaptcha(value)}
        />

        <button type="submit">Register</button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}
