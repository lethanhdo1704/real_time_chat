// frontend/src/App.jsx
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
// EAGER LOAD - CRITICAL PAGES (HIGH PRIORITY)
// ============================================
// Home là landing chính → không lazy để tránh delay
import Home from "./user/pages/Home";
import ProtectedRoute from "./user/components/common/ProtectedRoute";

// ============================================
// LAZY LOAD - AUTH PAGES (PRELOADED)
// ============================================
const Login = lazy(() => import("./user/pages/Login"));
const Register = lazy(() => import("./user/pages/Register"));
const ForgotPassword = lazy(() => import("./user/pages/ForgotPassword"));

// ============================================
// LAZY LOAD - SECONDARY PAGES (LOW PRIORITY)
// ============================================
const Settings = lazy(() => import("./user/pages/Settings"));
const JoinViaLink = lazy(() => import("./user/pages/JoinViaLink"));

// ============================================
// LAZY LOAD - POLICY PAGES (RARELY ACCESSED)
// ============================================
const PrivacyPolicy = lazy(() => import("./user/pages/LegalPolicies/PrivacyPolicy"));
const CookiesPolicy = lazy(() => import("./user/pages/LegalPolicies/CookiesPolicy"));
const TermsOfService = lazy(() => import("./user/pages/LegalPolicies/TermsOfService"));

// ============================================
// LAZY LOAD - ERROR PAGES
// ============================================
const NotFound = lazy(() => import("./user/pages/NotFound"));

function App() {
  // ============================================
  // SETUP VIEWPORT HEIGHT - MỘT LẦN CHO TOÀN APP
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
  // PRELOAD AUTH PAGES - GIẢM DELAY KHI CLICK
  // ============================================
  useEffect(() => {
    // Preload Login & Register ngay khi app mount
    // → 90% user vào site lần đầu sẽ cần Login/Register
    import("./user/pages/Login");
    import("./user/pages/Register");
    
    // Optional: Preload ForgotPassword sau 2s (ít urgent hơn)
    const timer = setTimeout(() => {
      import("./user/pages/ForgotPassword");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
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
                {/* ========================================== */}
                {/* PUBLIC ROUTES - Auth Pages                 */}
                {/* ========================================== */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgotpassword" element={<ForgotPassword />} />

                {/* ========================================== */}
                {/* PUBLIC ROUTES - Policy Pages (Standalone) */}
                {/* ========================================== */}
                <Route path="/policy/privacy" element={<PrivacyPolicy />} />
                <Route path="/policy/cookies" element={<CookiesPolicy />} />
                <Route path="/policy/terms" element={<TermsOfService />} />

                {/* ========================================== */}
                {/* PUBLIC ROUTES - Join Via Link             */}
                {/* ========================================== */}
                <Route path="/join/:code" element={<JoinViaLink />} />

                {/* ========================================== */}
                {/* PROTECTED ROUTES - Home (Main Chat)       */}
                {/* ========================================== */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                >
                  <Route path="friends" element={null} />
                  <Route path="friends/:conversationId" element={null} />
                  <Route path="groups" element={null} />
                  <Route path="groups/:conversationId" element={null} />
                  <Route path="requests" element={null} />
                  <Route path="add" element={null} />
                </Route>

                {/* ========================================== */}
                {/* PROTECTED ROUTES - Settings (Full Page)   */}
                {/* ========================================== */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* ========================================== */}
                {/* 404 NOT FOUND                             */}
                {/* ========================================== */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;