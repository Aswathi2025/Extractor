import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// Inject access token from Zustand store into every request
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Clean up empty parameters globally
  if (config.params) {
    Object.keys(config.params).forEach((key) => {
      if (config.params[key] === '' || config.params[key] === null || config.params[key] === undefined) {
        delete config.params[key];
      }
    });
  }

  return config;
});

// Handle 401 globally and map Django errors to standard format
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Map Django's 'error' or validation dict to 'message'
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (!data.message) {
        if (typeof data.error === 'string') {
          data.message = data.error;
        } else if (data.error && typeof data.error === 'object') {
          const firstKey = Object.keys(data.error)[0];
          const firstErr = data.error[firstKey];
          data.message = Array.isArray(firstErr) ? firstErr[0] : firstErr;
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          // Handle DRF serializer errors returned directly (e.g., {'email': ['Invalid']})
          const firstKey = Object.keys(data)[0];
          const firstErr = data[firstKey];
          data.message = Array.isArray(firstErr) ? firstErr[0] : firstErr;
        }
      }
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
