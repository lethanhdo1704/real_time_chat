// admin/hooks/auth/useLoginForm.js
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const useLoginForm = () => {
  const { t } = useTranslation('adminlogin');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = t('form.email.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('form.email.invalid');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('form.password.required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('form.password.minLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    formData,
    errors,
    showPassword,
    handleChange,
    togglePassword,
    validateForm
  };
};

export default useLoginForm;