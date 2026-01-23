// frontend/src/admin/routes/AdminRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/AdminLogin";
import AdminProtectedRoute from "./AdminProtectedRoute";

function DashboardPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">Admin Dashboard (coming soon)</h1>
    </div>
  );
}

export default function AdminRoutes() {
  return (
    <Routes>
      {/* PUBLIC - Nhưng đã qua IP Guard */}
      <Route path="/login" element={<AdminLogin />} />

      {/* PROTECTED - Cần auth */}
      <Route element={<AdminProtectedRoute />}>
        <Route path="/" element={<DashboardPlaceholder />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}