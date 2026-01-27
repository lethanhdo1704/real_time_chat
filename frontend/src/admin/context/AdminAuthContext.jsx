// frontend/src/admin/context/AdminAuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  // 🔥 NGĂN CHẶN INFINITE LOOP
  const hasVerified = useRef(false);

  useEffect(() => {
    // ✅ CHỈ VERIFY 1 LẦN DUY NHẤT KHI COMPONENT MOUNT
    if (!hasVerified.current) {
      hasVerified.current = true;
      verifyStoredToken();
    }
  }, []); // ⚠️ Empty dependency array - chỉ chạy 1 lần

  /**
   * ✅ ĐỌC ĐÚNG FORMAT: { success, data: { user } }
   * Backend hiện tại trả wrapped format
   */
  const verifyStoredToken = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      console.log('🔍 Verifying stored token:', token ? 'EXISTS' : 'NOT FOUND');

      if (!token) {
        console.log('❌ No token found, skipping verification');
        setLoading(false);
        return;
      }

      console.log('📡 Calling adminApi.verifyToken...');
      const response = await adminApi.verifyToken(token);

      console.log('📥 Verify response:', response);

      // ✅ ĐÚNG: Backend trả { success: true, data: { user: {...} } }
      if (response.success && response.data && response.data.user) {
        setAdmin(response.data.user);
        console.log('✅ Admin authenticated:', response.data.user);
      } else {
        console.log('❌ Invalid response format, clearing token');
        localStorage.removeItem('adminToken');
        setAdmin(null);
      }
      
    } catch (err) {
      console.error('❌ Token verification failed:', err);
      
      // ⚠️ Xóa token vì verify fail = token invalid
      console.log('🗑️ Removing invalid token');
      localStorage.removeItem('adminToken');
      setAdmin(null);
      
    } finally {
      setLoading(false);
      console.log('🏁 Verification complete');
    }
  };

  /**
   * ✅ ĐỌC ĐÚNG FORMAT: { success, data: { token, user } }
   * Backend hiện tại trả wrapped format
   */
  const login = async (email, password) => {
    setError(null);
    setIsRateLimited(false);
    setLoading(true);
    
    try {
      console.log('📝 Login attempt:', email);
      
      const response = await adminApi.login(email, password);
      
      console.log('📊 Login response:', response);
      
      // ✅ ĐÚNG: Backend trả { success: true, data: { token, user } }
      if (response.success && response.data && response.data.token && response.data.user) {
        localStorage.setItem('adminToken', response.data.token);
        setAdmin(response.data.user);
        
        console.log('✅ Login successful, token saved');
        
        return { 
          success: true,
          shouldRedirect: true
        };
      }
      
      // ⚠️ Response không có format đúng
      console.error('❌ Invalid login response format:', response);
      return { 
        success: false, 
        error: response.message || 'Invalid login response' 
      };
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // Check if it's a rate limit error
      const isRateLimit = 
        err.message.includes('429') || 
        err.message.toLowerCase().includes('rate');
      
      if (isRateLimit) {
        setIsRateLimited(true);
      }
      
      setError(err.message);
      
      return { 
        success: false, 
        error: err.message,
        isRateLimited: isRateLimit
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    
    // ✅ XÓA TOKEN
    localStorage.removeItem('adminToken');
    setAdmin(null);
    setError(null);
    setIsRateLimited(false);
    
    // Call API logout (không quan trọng nếu fail)
    adminApi.logout().catch(err => {
      console.warn('Logout API call failed (non-critical):', err);
    });
    
    console.log('✅ Logged out successfully');
  };

  const clearError = () => {
    setError(null);
    setIsRateLimited(false);
  };

  const value = {
    admin,
    loading,
    error,
    isRateLimited,
    login,
    logout,
    clearError
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};