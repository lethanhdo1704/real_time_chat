// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Load user từ token khi F5
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
        // Token sai -> logout nhẹ (ko navigate)
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // REGISTER
  const register = async (username, email, password) => {
    const res = await axios.post(
      "http://localhost:5000/api/auth/register",
      { username, email, password }
    );

    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);

    return res.data;
  };

  // LOGIN
  const login = async (email, password) => {
    const res = await axios.post(
      "http://localhost:5000/api/auth/login",
      { email, password }
    );

    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);

    //  Set user ngay lập tức -> Không cần đợi loadUser()
    setUser(res.data.user);

    return res.data;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, register, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
