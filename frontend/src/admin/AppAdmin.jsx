// admin/App.jsx
import React from "react";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminRoutes from "./routes/adminRoutes";

const AppAdmin = () => {
  return (
    <AdminAuthProvider>
        <AdminRoutes />
    </AdminAuthProvider>
  );
};

export default AppAdmin;
