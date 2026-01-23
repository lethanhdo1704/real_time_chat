// frontend/src/App.jsx
import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./user/context/AuthContext";
import { SocketProvider } from "./user/context/SocketContext";
import { setViewportHeight } from "./user/utils/setViewportHeight";

// ============================================
// LOADING COMPONENT
// ============================================
const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// ============================================
// LAZY LOAD - MAIN APPS
// ============================================
const AppUser = lazy(() => import("./user/AppUser"));
const AdminApp = lazy(() => import("./admin/AppAdmin"));

function App() {
  // ============================================
  // CHECK SUBDOMAIN OR PATH
  // ============================================
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  const isAdminDomain = 
    hostname === "admin.realtimechat.online" || 
    hostname === "www.admin.realtimechat.online" ||
    pathname.startsWith("/admin");

  // ============================================
  // SETUP VIEWPORT HEIGHT
  // ============================================
  useEffect(() => {
    setViewportHeight();

    window.addEventListener("resize", setViewportHeight);
    window.addEventListener("orientationchange", setViewportHeight);

    return () => {
      window.removeEventListener("resize", setViewportHeight);
      window.removeEventListener("orientationchange", setViewportHeight);
    };
  }, []);

  // ============================================
  // PRELOAD AUTH PAGES (CHỈ CHO USER)
  // ============================================
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
        <div
          className="
            h-[calc(var(--vh,1vh)*100)]
            supports-[height:100dvh]:h-dvh
            w-screen
          "
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {isAdminDomain ? (
                // ADMIN DOMAIN hoặc /admin path
                <Route path="/*" element={<AdminApp />} />
              ) : (
                // USER DOMAIN
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