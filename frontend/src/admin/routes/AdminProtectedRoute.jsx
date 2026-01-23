// frontend/src/admin/routes/AdminProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminProtectedRoute() {
  const { admin, loading } = useAdminAuth();

  if (loading) return null;

  if (!admin) {
    // Path tương đối (KHÔNG có /)
    return <Navigate to="login" replace />;
  }

  return <Outlet />;
}