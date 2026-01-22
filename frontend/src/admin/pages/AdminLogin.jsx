// admin/pages/AdminLogin.jsx

import React from 'react';
import LoginHeader from '../components/Login/LoginHeader';
import LoginForm from '../components/Login/LoginForm';

const AdminLogin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <LoginHeader />
          <LoginForm />
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Protected Admin Area • Authorized Access Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;