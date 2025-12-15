import { useState, useContext, useEffect } from "react"; 
import { AuthContext } from "../context/AuthContext"; 
import { useNavigate, Link } from "react-router-dom"; 
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, user, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.token);
      setToken(res.token);
    } catch (err) {
      setError(err.response?.data?.error || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="login-wrapper">
        {/* Left side - Branding */}
        <div className="branding">
          <div className="logo">REAL TIME CHAT</div>
          <p className="tagline">
            REAL TIME CHAT NƠI KẾT NỐI MỌI NGƯỜI
          </p>
        </div>

        {/* Right side - Login form */}
        <div className="login-box">
          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email hoặc số điện thoại"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
              />
              <span
                className="toggle-eye"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "👁️" : "🙈"}
              </span>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="forgot-password">
            <a href="#">Quên mật khẩu?</a>
          </div>

          <div className="create-account">
            <Link to="/register" className="create-btn">
              Tạo tài khoản mới
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}