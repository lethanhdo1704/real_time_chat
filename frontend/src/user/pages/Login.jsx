// frontend/src/pages/Login.jsx
import { LoginBranding, LoginForm, LoginFooter } from "../components/Login";
import { useLogin } from "../hooks/auth/useLogin";

export default function Login() {
  const loginProps = useLogin();

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
      <div className="min-h-screen bg-gray-50 grid md:grid-cols-[45%_55%]">
        {/* Left - Branding (Hidden on mobile) */}
        <LoginBranding />

        {/* Right - Login Form */}
        <LoginForm {...loginProps} />
      </div>
      
      {/* Footer - Nằm dưới cả 2 cột, full width */}
      <LoginFooter />
    </div>
  );
}