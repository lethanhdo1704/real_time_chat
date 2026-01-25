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
  
  const adminPaths = ['/dashboard', '/login'];
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
  
  const isAdminDomain = 
    hostname === "admin.realtimechat.online" || 
    hostname === "www.admin.realtimechat.online" ||
    (hostname === "localhost" && isAdminPath); // ✅ CHỈ cho localhost

  console.log('🔍 App routing:', {
    hostname,
    pathname,
    isAdminPath,
    isAdminDomain,
    willRender: isAdminDomain ? 'AdminApp' : 'AppUser'
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
    if (!isAdminDomain) {
      import("./user/pages/Login");
      import("./user/pages/Register");
      const timer = setTimeout(() => {
        import("./user/pages/ForgotPassword");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAdminDomain]);

  return (
    <AuthProvider>
      <SocketProvider>
        <div className="h-[calc(var(--vh,1vh)*100)] supports-[height:100dvh]:h-dvh w-screen">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/*" element={isAdminDomain ? <AdminApp /> : <AppUser />} />
            </Routes>
          </Suspense>
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;