import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('foa_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('foa_token');
      localStorage.removeItem('foa_is_admin');
      localStorage.removeItem('foa_name');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
