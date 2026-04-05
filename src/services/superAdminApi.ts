import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useSuperAdminStore } from '@/stores/superAdminStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

/**
 * Pre-configured Axios instance for Super Admin API calls.
 * - Entirely separate from tenant API calls.
 * - No X-Tenant-ID header injected.
 */
const superAdminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/super-admin`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Super Admin JWT
superAdminApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token } = useSuperAdminStore.getState();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 auto-logout
superAdminApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const { logout } = useSuperAdminStore.getState();
      logout();

      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/super-admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default superAdminApi;
