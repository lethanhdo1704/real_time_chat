// admin/components/Login/LoginHeader.jsx
import React from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoginHeader = () => {
  const { t } = useTranslation('adminlogin');

  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
        <Shield className="w-8 h-8 text-white" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {t('header.title')}
      </h1>
      
      <p className="text-gray-600">
        {t('header.subtitle')}
      </p>
    </div>
  );
};

export default LoginHeader;