import superAdminApi from './superAdminApi';
import { ApiResponse } from '@/types/common';
import { SuperAdminUser } from '@/stores/superAdminStore';

export interface SuperAdminLoginRequest {
  email: string;
  password?: string;
}

export interface SuperAdminAuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  superAdmin: SuperAdminUser;
}

export const superAdminAuthService = {
  login: async (data: SuperAdminLoginRequest): Promise<SuperAdminAuthResponse> => {
    const response = await superAdminApi.post<ApiResponse<SuperAdminAuthResponse>>('/auth/login', data);
    return response.data.data;
  },
  
  ping: async (): Promise<boolean> => {
    try {
      await superAdminApi.get('/auth/ping');
      return true;
    } catch {
      return false;
    }
  }
};
