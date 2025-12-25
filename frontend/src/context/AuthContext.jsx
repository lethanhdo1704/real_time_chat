import { createContext, useState, useEffect } from "react";
import api from "../services/api";
import useFriendStore from '@/store/friendStore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      null
    );
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Load user khi có token
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Load user failed:", err);
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

  // =========================
  // 🔐 AUTH ACTIONS
  // =========================

  // LOGIN
  const login = async (email, password, rememberMe = false) => {
    const res = await api.post("/auth/login", { email, password });

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
    useFriendStore.getState().reset();
    localStorage.removeItem('friend-store');
  };

  // =========================
  // 📨 REGISTER OTP
  // =========================

  const sendRegisterOTP = async (email) => {
    const res = await api.post("/otp/register", { email });
    return res.data;
  };

  const register = async ({ email, otp, nickname, password }) => {
    const res = await api.post("/otp/register/verify", {
      email,
      otp,
      nickname,
      password,
    });

    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }

    return res.data;
  };

  // =========================
  // 🔁 FORGOT PASSWORD
  // =========================

  const sendForgotOTP = async (email) => {
    const res = await api.post("/otp/forgot", { email });
    return res.data;
  };

  const verifyForgotOTP = async ({ email, otp, newPassword }) => {
    const res = await api.post("/otp/forgot/verify", {
      email,
      otp,
      newPassword,
    });
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        sendRegisterOTP,
        register,
        sendForgotOTP,
        verifyForgotOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
