// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // Đang load user từ token -> chờ
  if (loading) return <div>Loading...</div>;

  // Không có user -> chưa login
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
