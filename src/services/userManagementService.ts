import api from "./api";
import { ApiResponse } from "@/types/common";

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  active: boolean;
  /** Whether the user has a 4-digit PIN set (required for manager POS overrides). */
  hasPin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: string[];
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  pin?: string;
  phone?: string;
  roleNames: string[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleNames?: string[];
  /** Set/replace the 4-digit PIN. Omit (or leave blank) to keep the existing PIN. */
  pin?: string;
}

export const userManagementService = {
  getAll: () =>
    api.get<ApiResponse<UserResponse[]>>("/users").then((r) => r.data.data),

  getById: (id: string) =>
    api.get<ApiResponse<UserResponse>>(`/users/${id}`).then((r) => r.data.data),

  create: (data: CreateUserRequest) =>
    api.post<ApiResponse<UserResponse>>("/users", data).then((r) => r.data.data),

  update: (id: string, data: UpdateUserRequest) =>
    api.put<ApiResponse<UserResponse>>(`/users/${id}`, data).then((r) => r.data.data),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<UserResponse>>(`/users/${id}/toggle-status`).then((r) => r.data.data),

  bulkSetStatus: (ids: string[], active: boolean) =>
    api.post<ApiResponse<number>>("/users/bulk-status", { ids, active }).then((r) => r.data.data),
};
