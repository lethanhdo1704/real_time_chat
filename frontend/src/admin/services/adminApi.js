// frontend/src/admin/services/adminApi.js

const API_URL = import.meta.env.VITE_API_URL;

const adminApi = {
  /**
   * Admin login
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Admin login API error:', error);
      throw error;
    }
  },
  
  /**
   * Verify admin token
   */
  async verifyToken(token) {
    try {
      const response = await fetch(`${API_URL}/admin/auth/verify`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Token verification failed');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Token verification error:', error);
      throw error;
    }
  },

  /**
   * Admin logout
   */
  async logout() {
    try {
      await fetch(`${API_URL}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  },

  // ==================== USER MANAGEMENT ====================

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/users/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Get stats error:', error);
      throw error;
    }
  },

  /**
   * List users with filters
   */
  async listUsers(filters = {}) {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams(filters).toString();
      
      const response = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ List users error:', error);
      throw error;
    }
  },

  /**
   * Ban user
   */
  async banUser(userId, banData) {
    console.log('🌐 adminApi.banUser called:', { userId, banData });
    console.log('📍 Request URL:', `${API_URL}/admin/users/${userId}/ban`);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(banData)
      });
      
      const data = await response.json();
      console.log('📥 API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Ban user failed');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Ban user error:', error);
      throw error;
    }
  },

  /**
   * Unban user
   */
  async unbanUser(userId) {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Unban user error:', error);
      throw error;
    }
  }
};

export default adminApi;