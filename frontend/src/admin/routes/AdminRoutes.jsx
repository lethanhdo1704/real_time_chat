// frontend/src/admin/routes/AdminRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/AdminLogin";
import AdminProtectedRoute from "./AdminProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="login" element={<AdminLogin />} />

      {/* PROTECTED */}
      <Route element={<AdminProtectedRoute />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
        {/* Khi vào /admin sẽ redirect sang /admin/dashboard */}
      </Route>

      {/* Catch-all: redirect bất kỳ route admin không hợp lệ về dashboard */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}