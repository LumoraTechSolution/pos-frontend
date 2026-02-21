import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

/**
 * Pre-configured Axios instance for all API calls.
 * - Base URL from env
 * - JWT token injection via interceptor
 * - Tenant ID injection via interceptor
 * - 401 auto-logout
 */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT and tenant ID
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token, user } = useAuthStore.getState();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (user?.tenantId) {
      config.headers['X-Tenant-ID'] = user.tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 auto-logout
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();

      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
