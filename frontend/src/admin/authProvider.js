// src/admin/authProvider.js
import axios from 'axios';

export const authProvider = {
  login: async ({ email, password }) => {
    const res = await axios.post('/api/admin/auth/login', {
      email,
      password,
    });

    localStorage.setItem('admin_token', res.data.data.token);
    return Promise.resolve();
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    return Promise.resolve();
  },

  checkAuth: () =>
    localStorage.getItem('admin_token')
      ? Promise.resolve()
      : Promise.reject(),

  checkError: (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('admin_token');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: async () => {
    const res = await axios.get('/api/admin/auth/verify', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });

    return {
      id: res.data.data.user.uid,
      fullName: res.data.data.user.nickname,
      avatar: res.data.data.user.avatar,
    };
  },

  getPermissions: () => Promise.resolve('admin'),
};
