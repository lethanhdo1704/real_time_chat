// frontend/src/admin/routes/AdminProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminProtectedRoute() {
  const { admin, loading } = useAdminAuth();

  // Loading - KHÔNG hiển thị gì
  if (loading) return null;

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}