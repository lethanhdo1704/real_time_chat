// frontend/src/admin/routes/AdminRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/AdminLogin";
import AdminProtectedRoute from "./AdminProtectedRoute";

function DashboardPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Admin Dashboard (coming soon)
      </h1>
    </div>
  );
}

export default function AdminRoutes() {
  return (
    <Routes>
      {/* PUBLIC - path tương đối (KHÔNG có /) */}
      <Route path="login" element={<AdminLogin />} />

      {/* PROTECTED */}
      <Route element={<AdminProtectedRoute />}>
        <Route index element={<DashboardPlaceholder />} />
        {/* index = path="/" trong nested route */}
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}