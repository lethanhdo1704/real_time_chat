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

  // REGISTER
  const register = async ({ nickname, email, password, otp }) => {
    const res = await axios.post("http://localhost:5000/api/auth/register", {
      nickname,
      email,
      password,
      otp,
    });

    // Nếu backend trả token sau verify OTP
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }

    return res.data;
  };

  // SEND OTP
  const sendOTP = async (email) => {
    const res = await axios.post("http://localhost:5000/api/otp/send", { email });
    return res.data;
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
      value={{ user, token, login, logout, register, sendOTP, loading, setToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
