
export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  featuresEnabled: string[];
  planTier: string;
  maxLocations: number;
  maxUsers: number;
  maxProducts: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password?: string;
  tenantId: string;
}

export interface PinLoginRequest {
  pin: string;
  tenantId: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  tenantId: string;
}
