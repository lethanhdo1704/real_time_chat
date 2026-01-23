// frontend/src/App.jsx
import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./user/context/AuthContext";
import { SocketProvider } from "./user/context/SocketContext";
import { setViewportHeight } from "./user/utils/setViewportHeight";

const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center">
    Loading...
  </div>
);

const AppUser = lazy(() => import("./user/AppUser"));
const AppAdmin = lazy(() => import("./admin/AppAdmin"));

function App() {
  const isAdminSubdomain =
    window.location.hostname === "admin.realtimechat.online";

  useEffect(() => {
    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);
    window.addEventListener("orientationchange", setViewportHeight);
    return () => {
      window.removeEventListener("resize", setViewportHeight);
      window.removeEventListener("orientationchange", setViewportHeight);
    };
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {isAdminSubdomain ? (
              // ADMIN DOMAIN
              <Route path="/*" element={<AppAdmin />} />
            ) : (
              // MAIN DOMAIN
              <>
                <Route path="/admin/*" element={<AppAdmin />} />
                <Route path="/*" element={<AppUser />} />
              </>
            )}
          </Routes>
        </Suspense>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
