// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user khi có token
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  // SEND OTP đăng ký - FIXED: Throw error object
  const sendRegisterOTP = async (email) => {
    try {
      const res = await axios.post("http://localhost:5000/api/otp/register", { email });
      return res.data;
    } catch (err) {
      // Throw lại error object để component có thể truy cập err.response
      throw err;
    }
  };

  // VERIFY OTP + tạo user (đổi tên thành register để match với component)
  const register = async ({ email, otp, nickname, password }) => {
    try {
      const res = await axios.post("http://localhost:5000/api/otp/register/verify", {
        email,
        otp,
        nickname,
        password,
      });

      // Nếu backend trả token sau verify OTP
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }

      return res.data;
    } catch (err) {
      // Throw lại error object
      throw err;
    }
  };

  // SEND OTP quên mật khẩu - FIXED
  const sendForgotOTP = async (email) => {
    try {
      const res = await axios.post("http://localhost:5000/api/otp/forgot", { email });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // VERIFY OTP quên mật khẩu + đổi mật khẩu - FIXED
  const verifyForgotOTP = async ({ email, otp, newPassword }) => {
    try {
      const res = await axios.post("http://localhost:5000/api/otp/forgot/verify", {
        email,
        otp,
        newPassword,
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // LOGIN
  const login = async (email, password, rememberMe = false) => {
    const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });

    if (rememberMe) {
      localStorage.setItem("token", res.data.token);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", res.data.token);
      localStorage.removeItem("token");
    }

    setToken(res.data.token);
    setUser(res.data.user);

    return res.data;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        setToken,
        login,
        logout,
        sendRegisterOTP,
        register, // Export register thay vì verifyRegisterOTP
        sendForgotOTP,
        verifyForgotOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};