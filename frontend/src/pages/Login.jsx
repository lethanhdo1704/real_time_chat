// frontend/src/pages/Login.jsx
import { LoginBranding, LoginForm } from "../components/Login";
import { useLogin } from "../hooks/auth/useLogin";

export default function Login() {
  const loginProps = useLogin();

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden">
      <div className="h-full w-full bg-gray-50 grid md:grid-cols-[45%_55%]">
        {/* Left - Branding (Hidden on mobile) */}
        <LoginBranding />

        {/* Right - Login Form */}
        <LoginForm {...loginProps} />
      </div>
    </div>
  );
}