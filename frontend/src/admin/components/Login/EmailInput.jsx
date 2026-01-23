// admin/components/Login/EmailInput.jsx
import React from 'react';
import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmailInput = ({ value, error, onChange }) => {
  const { t } = useTranslation('adminlogin');

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('form.email.label')}
      </label>
      
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        <input
          type="email"
          name="email"
          value={value}
          onChange={onChange}
          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            error 
              ? 'border-red-300 focus:ring-red-200' 
              : 'border-gray-300 focus:ring-blue-200'
          }`}
          placeholder={t('form.email.placeholder')}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default EmailInput;