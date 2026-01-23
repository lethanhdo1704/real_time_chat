// admin/components/Login/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import useLoginForm from '../../hooks/auth/useLoginForm';
import ErrorMessage from '../common/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage';
import EmailInput from './EmailInput';
import PasswordInput from './PasswordInput';
import LoginButton from './LoginButton';

const LoginForm = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const {
    formData,
    errors,
    showPassword,
    handleChange,
    togglePassword,
    validateForm
  } = useLoginForm();

  const handleSubmit = async () => {
    setMessage({ type: '', text: '' });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    setLoading(false);

    if (result.success) {
      // ✅ Redirect to dashboard
      navigate('/dashboard');
    } else {
      setMessage({ 
        type: 'error', 
        text: result.error 
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6" onKeyPress={handleKeyPress}>
      {message.type === 'error' && <ErrorMessage message={message.text} />}
      {message.type === 'success' && <SuccessMessage message={message.text} />}
      
      <EmailInput 
        value={formData.email}
        error={errors.email}
        onChange={handleChange}
      />
      
      <PasswordInput
        value={formData.password}
        error={errors.password}
        showPassword={showPassword}
        onChange={handleChange}
        onToggle={togglePassword}
      />
      
      <LoginButton loading={loading} onClick={handleSubmit} />
    </div>
  );
};

export default LoginForm;