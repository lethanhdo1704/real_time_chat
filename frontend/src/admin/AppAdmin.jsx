// admin/AppAdmin.jsx
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminRoutes from "./routes/AdminRoutes";
import AdminIpGuard from "./routes/AdminIpGuard";

export default function AppAdmin() {
  return (
    <AdminIpGuard>
      <AdminAuthProvider>
        <AdminRoutes />
      </AdminAuthProvider>
    </AdminIpGuard>
  );
}
