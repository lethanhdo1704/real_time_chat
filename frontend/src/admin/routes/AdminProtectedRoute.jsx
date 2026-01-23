// admin/routes/AdminProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminProtectedRoute() {
  const { admin, loading } = useAdminAuth();

  if (loading) return null;

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
