import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { performLogout } from '@/lib/performLogout';

// `??` not `||`: an empty string means "same-origin, use the relative /api/v1
// path" (production proxy via next.config rewrites). Only unset/undefined falls
// back to the local-dev backend.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081';

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
  withCredentials: true,
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

// Mutex and queue for concurrent token refreshes
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor — handle 401 auto-logout & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, setAuth, user } = useAuthStore.getState();

      if (!refreshToken || !user) {
        isRefreshing = false;
        await performLogout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Use clean axios to prevent infinite loops if refresh fails
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
          tenantId: user.tenantId,
        });
        const data = response.data.data;

        // Backend returns `accessToken`, not `token`.
        setAuth(data.user, data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await performLogout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
