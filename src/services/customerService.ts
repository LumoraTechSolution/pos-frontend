import api from './api';
import { ApiResponse, PageResponse } from '@/types/api';

export interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface CustomerRequest {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const customerService = {
  getCustomers: (params?: { query?: string; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<Customer>>>('/customers', { params }).then(res => res.data.data),

  getCustomer: (id: string) =>
    api.get<ApiResponse<Customer>>(`/customers/${id}`).then(res => res.data.data),

  createCustomer: (data: CustomerRequest) =>
    api.post<ApiResponse<Customer>>('/customers', data).then(res => res.data.data),

  updateCustomer: (id: string, data: CustomerRequest) =>
    api.put<ApiResponse<Customer>>(`/customers/${id}`, data).then(res => res.data.data),

  deleteCustomer: (id: string) =>
    api.delete<ApiResponse<void>>(`/customers/${id}`).then(res => res.data.data),
};
