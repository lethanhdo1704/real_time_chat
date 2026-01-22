// admin/components/Login/LoginButton.jsx

import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

const LoginButton = ({ loading, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Signing in...</span>
        </div>
      ) : (
        'Sign In'
      )}
    </button>
  );
};

export default LoginButton;