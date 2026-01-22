import simpleRestProvider from 'ra-data-simple-rest';

const API_URL = import.meta.env.VITE_ADMIN_API_URL;

const httpClient = async (url, options = {}) => {
  const token = localStorage.getItem('admin_token');

  options.headers = new Headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const res = await fetch(url, options);
  if (!res.ok) throw res;
  return res.json();
};

const dataProvider = simpleRestProvider(API_URL, httpClient);

export default dataProvider;
