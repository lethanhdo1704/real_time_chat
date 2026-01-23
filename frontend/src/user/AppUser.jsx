// frontend/src/user/AppUser.jsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";

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
import Home from "./pages/Home";

// ============================================
// LAZY LOAD - AUTH PAGES
// ============================================
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// ============================================
// LAZY LOAD - SECONDARY PAGES
// ============================================
const Settings = lazy(() => import("./pages/Settings"));
const JoinViaLink = lazy(() => import("./pages/JoinViaLink"));

// ============================================
// LAZY LOAD - POLICY PAGES
// ============================================
const PrivacyPolicy = lazy(() => import("./pages/LegalPolicies/PrivacyPolicy"));
const CookiesPolicy = lazy(() => import("./pages/LegalPolicies/CookiesPolicy"));
const TermsOfService = lazy(() => import("./pages/LegalPolicies/TermsOfService"));

// ============================================
// LAZY LOAD - ERROR PAGES
// ============================================
const NotFound = lazy(() => import("./pages/NotFound"));

function AppUser() {
  return (
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
  );
}

export default AppUser;