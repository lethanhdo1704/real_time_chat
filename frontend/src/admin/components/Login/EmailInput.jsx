// admin/components/Login/EmailInput.jsx

import React from 'react';
import { Mail } from 'lucide-react';

const EmailInput = ({ value, error, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Address
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
          placeholder="admin@example.com"
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default EmailInput;