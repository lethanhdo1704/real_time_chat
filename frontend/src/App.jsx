import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <SocketProvider>
          <div className="h-screen w-screen">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/friends" replace />} />
                <Route path="friends" element={null} />
                <Route path="friends/:conversationId" element={null} />
                <Route path="groups" element={null} />
                <Route path="groups/:conversationId" element={null} />
                <Route path="requests" element={null} />
                <Route path="add" element={null} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;