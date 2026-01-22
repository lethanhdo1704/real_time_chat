import axios from 'axios';

const API_URL = import.meta.env.VITE_ADMIN_API_URL;

const authProvider = {
  login: async ({ username, password }) => {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: username,
      password,
    });

    const { token, user } = res.data.data;

    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));

    return Promise.resolve();
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return Promise.resolve();
  },

  checkAuth: () => {
    return localStorage.getItem('admin_token')
      ? Promise.resolve()
      : Promise.reject();
  },

  checkError: (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('admin_token');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    const user = JSON.parse(localStorage.getItem('admin_user'));
    return Promise.resolve({
      id: user.uid,
      fullName: user.nickname,
      avatar: user.avatar,
    });
  },

  getPermissions: () => {
    const user = JSON.parse(localStorage.getItem('admin_user'));
    return Promise.resolve(user.role);
  },
};

export default authProvider;
