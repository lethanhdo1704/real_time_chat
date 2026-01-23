import { Routes, Route } from "react-router-dom";
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
      {/* PUBLIC */}
      <Route path="login" element={<AdminLogin />} />

      {/* PROTECTED */}
      <Route element={<AdminProtectedRoute />}>
        <Route index element={<DashboardPlaceholder />} />
        {/* tương đương /admin */}
      </Route>
    </Routes>
  );
}
