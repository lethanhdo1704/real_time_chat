// admin/components/Login/PasswordInput.jsx
import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PasswordInput = ({ value, error, showPassword, onChange, onToggle }) => {
  const { t } = useTranslation('adminlogin');

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('form.password.label')}
      </label>
      
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={value}
          onChange={onChange}
          className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            error 
              ? 'border-red-300 focus:ring-red-200' 
              : 'border-gray-300 focus:ring-blue-200'
          }`}
          placeholder={t('form.password.placeholder')}
        />
        
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PasswordInput;