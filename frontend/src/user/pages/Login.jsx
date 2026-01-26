// frontend/src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { LoginBranding, LoginForm, LoginFooter } from "../components/Login";
import { useLogin } from "../hooks/auth/useLogin";
import BanToast from "../components/common/BanToast"; // 🔥 THÊM IMPORT

export default function Login() {
  const loginProps = useLogin();
  const [banMessage, setBanMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("banned")) {
      // Get message from session storage
      const message = sessionStorage.getItem('banMessage') || 'Tài khoản của bạn đã bị cấm';
      setBanMessage(message);
      setShowToast(true);
      
      // Clean up
      sessionStorage.removeItem('banMessage');
      window.history.replaceState({}, document.title, '/login');
    }
  }, []);

  const handleCloseToast = () => {
    setShowToast(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
      {/* 🔥 HIỂN THỊ TOAST */}
      <BanToast 
        message={banMessage} 
        isVisible={showToast} 
        onClose={handleCloseToast} 
      />
      
      <div className="min-h-screen bg-gray-50 grid md:grid-cols-[45%_55%]">
        <LoginBranding />
        <LoginForm {...loginProps} />
      </div>
      
      <LoginFooter />
    </div>
  );
}