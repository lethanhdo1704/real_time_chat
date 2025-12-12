// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);

  // Nếu chưa login (không có token) → redirect sang /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã login → hiển thị trang
  return children;
}
