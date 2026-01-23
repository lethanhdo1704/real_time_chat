// admin/pages/AdminLogin.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import LoginHeader from '../components/Login/LoginHeader';
import LoginForm from '../components/Login/LoginForm';

const AdminLogin = () => {
  const { t, i18n } = useTranslation('adminlogin');

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('adminLang', lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-2">
          <Globe className="w-4 h-4 text-gray-600" />
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1 rounded transition-colors ${
              i18n.language === 'en' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => changeLanguage('vi')}
            className={`px-3 py-1 rounded transition-colors ${
              i18n.language === 'vi' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            VI
          </button>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <LoginHeader />
          <LoginForm />
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('footer.text')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;