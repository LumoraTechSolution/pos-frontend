import api from './api';
import { AuthResponse, LoginRequest, PinLoginRequest, RefreshTokenRequest } from '@/types/auth';
import { ApiResponse } from '@/types/common';

/**
 * Service for authentication-related API calls.
 */
export const authService = {
  /**
   * Login with email and password.
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  /**
   * Login with 4-digit PIN (Cashier fast-login).
   */
  pinLogin: async (data: PinLoginRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/pin-login', data);
    return response.data.data;
  },

  /**
   * Refresh access token using refresh token.
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/refresh', data);
    return response.data.data;
  },

  /**
   * Log out and revoke refresh tokens.
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Get current authenticated user profile.
   */
  getMe: async (): Promise<AuthResponse['user']> => {
    const response = await api.get<ApiResponse<AuthResponse['user']>>('/auth/me');
    return response.data.data;
  },
};
