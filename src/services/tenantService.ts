import api from './api';

export interface TenantInfo {
  id: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  receiptFooter?: string | null;
}

export interface TenantInfoUpdateRequest {
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  receiptFooter?: string | null;
}

export const tenantService = {
  getInfo: async (): Promise<TenantInfo> => {
    const res = await api.get<{ data: TenantInfo }>('/tenant/info');
    return res.data.data;
  },

  updateInfo: async (data: TenantInfoUpdateRequest): Promise<TenantInfo> => {
    const res = await api.put<{ data: TenantInfo }>('/tenant/info', data);
    return res.data.data;
  },
};
