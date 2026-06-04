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

  /**
   * Validates a logo image server-side and returns it as a data URI. The URI is
   * only persisted when subsequently passed to updateInfo as `logoUrl`.
   */
  uploadLogo: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<{ data: { logoUrl: string } }>('/tenant/info/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.logoUrl;
  },
};
