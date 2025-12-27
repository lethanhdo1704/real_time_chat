// src/components/common/ProtectedRoute.jsx
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute - Single source of truth for auth protection
 * 
 * ✅ Waits for loading to complete
 * ✅ Redirects to /login if no user
 * ✅ Prevents race conditions
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // ⏳ Still loading user from token - WAIT
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-semibold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // 🚫 No user after loading - redirect to login
  if (!user) {
    console.log('🔒 [ProtectedRoute] No user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // ✅ User authenticated - render children
  console.log('✅ [ProtectedRoute] User authenticated:', user.uid);
  return children;
}