// frontend/src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./user/context/AuthContext";
import { SocketProvider } from "./user/context/SocketContext";
import { setViewportHeight } from "./user/utils/setViewportHeight";

// Pages
import Login from "./user/pages/Login";
import Register from "./user/pages/Register";
import Home from "./user/pages/Home";
import Settings from "./user/pages/Settings";
import ForgotPassword from "./user/pages/ForgotPassword";
import NotFound from "./user/pages/NotFound";
import JoinViaLink from "./user/pages/JoinViaLink"; // 🔥 NEW

// Policy Pages (Standalone)
import PrivacyPolicy from "./user/pages/LegalPolicies/PrivacyPolicy";
import CookiesPolicy from "./user/pages/LegalPolicies/CookiesPolicy";
import TermsOfService from "./user/pages/LegalPolicies/TermsOfService";

// Components
import ProtectedRoute from "./user/components/common/ProtectedRoute";

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

              {/* 🔥 NEW: Public Join Via Link Route */}
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
          </div>
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
