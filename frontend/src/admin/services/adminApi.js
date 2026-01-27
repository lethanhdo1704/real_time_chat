// frontend/src/admin/services/adminApi.js

const API_URL = import.meta.env.VITE_API_URL;

// 🚨 AUTH ENDPOINTS - KHÔNG BAO GIỜ RETRY
const NO_RETRY_ENDPOINTS = [
  '/admin/auth/login',
  '/admin/auth/verify',
  '/admin/auth/logout'
];

// Rate limit handler - CHỈ cho data fetching, KHÔNG cho auth
const rateLimitHandler = {
  retryDelays: [1000, 2000, 4000],

  async fetchWithRetry(url, options, retryCount = 0) {
    // ✅ KIỂM TRA: endpoint có phải auth không?
    const isNoRetry = NO_RETRY_ENDPOINTS.some(endpoint => url.includes(endpoint));

    try {
      const response = await fetch(url, options);

      // ⚠️ CHỈ RETRY NẾU:
      // 1. Là 429
      // 2. KHÔNG phải auth endpoint
      // 3. Chưa hết retry limit
      if (
        response.status === 429 &&
        !isNoRetry &&
        retryCount < this.retryDelays.length
      ) {
        const delay = this.retryDelays[retryCount];
        console.warn(`⏳ Rate limited (data fetch). Retrying in ${delay}ms... (Attempt ${retryCount + 1})`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
};

const adminApi = {
  /**
   * Admin login - KHÔNG BAO GIỜ AUTO RETRY
   */
  async login(email, password) {
    try {
      // ✅ GỌI FETCH TRỰC TIẾP - KHÔNG qua rateLimitHandler
      const response = await fetch(`${API_URL}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // 🚨 429 = user phải đợi, KHÔNG retry tự động
        if (response.status === 429) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        }
        throw new Error(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('❌ Admin login API error:', error);
      throw error;
    }
  },

  /**
   * Verify admin token - KHÔNG BAO GIỜ AUTO RETRY
   */
  async verifyToken(token) {
    try {
      // ✅ GỌI FETCH TRỰC TIẾP - KHÔNG retry
      const response = await fetch(`${API_URL}/admin/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
  },

  /**
   * Admin logout - KHÔNG BAO GIỜ AUTO RETRY
   */
  async logout() {
    try {
      const token = localStorage.getItem('adminToken');

      if (token) {
        // ✅ GỌI FETCH TRỰC TIẾP - KHÔNG retry
        await fetch(`${API_URL}/admin/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  },

  // ==================== USER MANAGEMENT ====================
  // ✅ CÁC API DATA FETCHING có thể dùng retry

  /**
   * Get user statistics - CÓ THỂ RETRY
   */
  async getUserStatistics() {
    try {
      const token = localStorage.getItem('adminToken');

      // ✅ Data fetching - có thể retry nếu 429
      const response = await rateLimitHandler.fetchWithRetry(
        `${API_URL}/admin/users/statistics`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get statistics');
      }

      return data;
    } catch (error) {
      console.error('❌ Get stats error:', error);
      throw error;
    }
  },

  /**
   * List users with filters - CÓ THỂ RETRY
   */
  async listUsers(filters = {}) {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams(filters).toString();

      // ✅ Data fetching - có thể retry nếu 429
      const response = await rateLimitHandler.fetchWithRetry(
        `${API_URL}/admin/users?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to list users');
      }

      return data;
    } catch (error) {
      console.error('❌ List users error:', error);
      throw error;
    }
  },

  /**
   * Ban user - KHÔNG RETRY (mutation)
   */
  async banUser(userId, banData) {
    console.log('🌐 adminApi.banUser called:', { userId, banData });
    console.log('📍 Request URL:', `${API_URL}/admin/users/${userId}/ban`);

    try {
      const token = localStorage.getItem('adminToken');

      // ✅ Mutation - KHÔNG retry
      const response = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
   * Unban user - KHÔNG RETRY (mutation)
   */
  async unbanUser(userId) {
    try {
      const token = localStorage.getItem('adminToken');

      // ✅ Mutation - KHÔNG retry
      const response = await fetch(`${API_URL}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unban user failed');
      }

      return data;
    } catch (error) {
      console.error('❌ Unban user error:', error);
      throw error;
    }
  },

  /**
   * Update user role (SUPER_ADMIN ONLY) - KHÔNG RETRY (mutation)
   */
  async updateUserRole(userId, newRole) {
    console.log('🌐 adminApi.updateUserRole called:', { userId, newRole });
    console.log('📍 Request URL:', `${API_URL}/admin/users/${userId}/role`);

    try {
      const token = localStorage.getItem('adminToken');

      // ✅ Mutation - KHÔNG retry
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      console.log('📥 API Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Update role failed');
      }

      return data;
    } catch (error) {
      console.error('❌ Update user role error:', error);
      throw error;
    }
  }
};

export default adminApi;