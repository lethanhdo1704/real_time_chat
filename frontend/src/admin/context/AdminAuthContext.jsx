// frontend/src/admin/context/AdminAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../services/adminApi';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyStoredToken();
  }, []);

  const verifyStoredToken = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await adminApi.verifyToken(token);
      
      if (response.success && response.data) {
        setAdmin(response.data.user);
      }
      
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('adminToken');
      setAdmin(null);
      
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    
    try {
      console.log('📝 Login called with:', email);
      
      const response = await adminApi.login(email, password);
      
      console.log('📊 Login response:', response);
      
      if (response.success && response.data) {
        localStorage.setItem('adminToken', response.data.token);
        setAdmin(response.data.user);
        
        return { 
          success: true,
          shouldRedirect: true // ✅ Flag để redirect
        };
      }
      
      return { 
        success: false, 
        error: response.message || 'Login failed' 
      };
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message);
      
      return { 
        success: false, 
        error: err.message 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
    adminApi.logout();
  };

  const value = {
    admin,
    loading,
    error,
    login,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};