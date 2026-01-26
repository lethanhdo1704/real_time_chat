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
        {/* Khi vào / sẽ redirect sang /dashboard */}
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}