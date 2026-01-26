// frontend/src/App.jsx
import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./user/context/AuthContext";
import { SocketProvider } from "./user/context/SocketContext";
import { setViewportHeight } from "./user/utils/setViewportHeight";

const AppUser = lazy(() => import("./user/AppUser"));
const AdminApp = lazy(() => import("./admin/AppAdmin"));

function App() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // ✅ PHÂN BIỆT RÕ RÀNG THEO ĐƯỜNG DẪN
  const isProduction = hostname !== "localhost";
  
  // Production: dựa vào subdomain
  const isAdminDomain = 
    isProduction && (
      hostname === "admin.realtimechat.online" || 
      hostname === "www.admin.realtimechat.online"
    );
  
  // Development: DỰA VÀO /admin PATH
  const isAdminPath = pathname.startsWith('/admin');
  
  // ✅ USER LOGIN PATH (luôn luôn là /login)
  const isUserLoginPath = pathname === '/login';

  console.log('🔍 App routing:', {
    hostname,
    pathname,
    isProduction,
    isAdminDomain,
    isAdminPath,
    isUserLoginPath
  });

  useEffect(() => {
    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);
    window.addEventListener("orientationchange", setViewportHeight);
    return () => {
      window.removeEventListener("resize", setViewportHeight);
      window.removeEventListener("orientationchange", setViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (!isAdminDomain && !isAdminPath) {
      import("./user/pages/Login");
      import("./user/pages/Register");
      const timer = setTimeout(() => {
        import("./user/pages/ForgotPassword");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAdminDomain, isAdminPath]);

  return (
    <AuthProvider>
      <SocketProvider>
        <div className="h-[calc(var(--vh,1vh)*100)] supports-[height:100dvh]:h-dvh w-full">
          <Suspense fallback={null}>
            <Routes>
              {/* ✅ USER LOGIN - LUÔN DÙNG AppUser */}
              {isUserLoginPath ? (
                <Route path="/login/*" element={<AppUser />} />
              ) : 
              /* ✅ ADMIN PATH - DÙNG AdminApp */
              isAdminDomain || isAdminPath ? (
                <Route path="/admin/*" element={<AdminApp />} />
              ) : (
                /* ✅ USER APP - MỌI THỨ KHÁC */
                <Route path="/*" element={<AppUser />} />
              )}
            </Routes>
          </Suspense>
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;