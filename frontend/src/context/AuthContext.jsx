// frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import api from "../services/api";
import useChatStore from '../store/chat/chatStore';
import useFriendStore from '../store/friendStore';

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
        
        // ✅ FIX: Lấy user từ res.data.data (vì backend trả về { success, data: {...} })
        const userData = res.data.data || res.data;
        
        console.log("✅ [Auth] User loaded:", {
          uid: userData.uid,
          nickname: userData.nickname
        });
        
        setUser(userData);
      } catch (err) {
        console.error("❌ [Auth] Load user failed:", err);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setToken(null);
        setUser(null);
        
        // 🔥 Clear stores on auth error
        useChatStore.getState().resetStore();
        useFriendStore.getState().reset();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // =========================
  // 🔐 AUTH ACTIONS
  // =========================

  // 🔥 UPDATE USER - Cập nhật một phần thông tin user
  const updateUser = (partialUser) => {
    setUser(prev => {
      if (!prev) return prev;
      
      const updated = {
        ...prev,
        ...partialUser,
      };
      
      console.log("✅ [Auth] User updated:", {
        updated: Object.keys(partialUser),
        uid: updated.uid
      });
      
      return updated;
    });
  };

  // LOGIN
  const login = async (email, password, rememberMe = false) => {
    // 🔥 Clear old data before login (important for switching accounts)
    console.log('🧹 [Auth] Clearing stores before login...');
    useChatStore.getState().resetStore();
    useFriendStore.getState().reset();
    localStorage.removeItem('friend-storage');
    
    const res = await api.post("/auth/login", { email, password });

    if (rememberMe) {
      localStorage.setItem("token", res.data.token);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", res.data.token);
      localStorage.removeItem("token");
    }

    setToken(res.data.token);
    
    // ✅ FIX: Xử lý response có thể có format khác nhau
    const userData = res.data.user || res.data.data;
    setUser(userData);
    
    console.log('✅ [Auth] Login successful:', userData.uid);

    return res.data;
  };

  // LOGOUT
  const logout = () => {
    console.log('🚪 [Auth] Logging out...');
    
    // 1. Clear tokens
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    
    // 2. Clear auth state
    setToken(null);
    setUser(null);
    
    // 3. 🔥 Clear chat store
    useChatStore.getState().resetStore();
    
    // 4. 🔥 Clear friend store
    useFriendStore.getState().reset();
    
    // 5. 🔥 Clear persisted storage
    localStorage.removeItem('friend-storage');
    
    console.log('✅ [Auth] Logout complete - All stores cleared');
  };

  // =========================
  // 📨 REGISTER OTP
  // =========================

  const sendRegisterOTP = async (email) => {
    const res = await api.post("/otp/register", { email });
    return res.data;
  };

  const register = async ({ email, otp, nickname, password }) => {
    // 🔥 Clear stores before register (edge case)
    useChatStore.getState().resetStore();
    useFriendStore.getState().reset();
    
    const res = await api.post("/otp/register/verify", {
      email,
      otp,
      nickname,
      password,
    });

    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      
      // ✅ FIX: Xử lý response có thể có format khác nhau
      const userData = res.data.user || res.data.data;
      setUser(userData);
      
      console.log('✅ [Auth] Registration successful:', userData.uid);
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
        updateUser, // 🔥 ADD THIS
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