// admin/components/Login/LoginButton.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../common/LoadingSpinner';

const LoginButton = ({ loading, onClick }) => {
  const { t } = useTranslation('adminlogin');

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          <span>{t('form.button.signingIn')}</span>
        </div>
      ) : (
        t('form.button.signIn')
      )}
    </button>
  );
};

export default LoginButton;