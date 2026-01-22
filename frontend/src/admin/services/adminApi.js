// admin/services/adminApi.js

const adminApi = {
  baseURL: '/api/admin',
  
  /**
   * Admin login
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
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
   * @param {string} token 
   * @returns {Promise<Object>}
   */
  async verifyToken(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
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
  }
};

export default adminApi;