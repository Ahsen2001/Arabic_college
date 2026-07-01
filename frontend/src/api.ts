import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor to attach Sanctum bearer token and language locale to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const locale = localStorage.getItem('i18nextLng') || 'ar';
    if (locale && config.headers) {
      config.headers['X-Locale'] = locale;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
