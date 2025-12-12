// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      axios
        .get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => setUser(res.data))
        .catch(() => logout());
    }
  }, [token]);

  // Gọi API register
  const register = async (username, email, password) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        { username, email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Gọi API login
  const login = async (email, password) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
