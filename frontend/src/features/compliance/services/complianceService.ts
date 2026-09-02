import { apiClient } from '../../../services/apiClient';

export interface VatRegisterQuery {
  startDate?: string;
  endDate?: string;
  firmId?: string;
  page?: number;
  limit?: number;
}

export interface VatSalesRegisterResponse {
  organizationName: string;
  organizationPan: string;
  periodLabel: string;
  rows: Array<{
    date: string;
    bsDate: string;
    documentNumber: string;
    buyerName: string;
    buyerPan?: string;
    totalSales: number;
    exemptSales: number;
    zeroRatedSales: number;
    taxableSales: number;
    vatCollected: number;
    isCancelled: boolean;
  }>;
  totals: {
    totalSales: number;
    exemptSales: number;
    taxableSales: number;
    vatCollected: number;
  };
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VatPurchaseRegisterResponse {
  organizationName: string;
  organizationPan: string;
  periodLabel: string;
  rows: Array<{
    date: string;
    bsDate: string;
    documentNumber: string;
    supplierName: string;
    supplierPan?: string;
    totalPurchases: number;
    exemptPurchases: number;
    taxablePurchases: number;
    vatPaid: number;
  }>;
  totals: {
    totalPurchases: number;
    exemptPurchases: number;
    taxablePurchases: number;
    vatPaid: number;
  };
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const complianceService = {
  getSalesRegister: async (orgId: string, query?: VatRegisterQuery): Promise<VatSalesRegisterResponse> => {
    const res = await apiClient.get(`/organizations/${orgId}/compliance/sales-register`, { params: query });
    return res.data.data;
  },

  getPurchaseRegister: async (orgId: string, query?: VatRegisterQuery): Promise<VatPurchaseRegisterResponse> => {
    const res = await apiClient.get(`/organizations/${orgId}/compliance/purchase-register`, { params: query });
    return res.data.data;
  },

  getSequences: async (orgId: string) => {
    const res = await apiClient.get(`/organizations/${orgId}/compliance/sequences`);
    return res.data.data;
  },

  upsertSequence: async (orgId: string, payload: any) => {
    const res = await apiClient.post(`/organizations/${orgId}/compliance/sequences`, payload);
    return res.data.data;
  },

  closeFiscalPeriod: async (orgId: string, periodId: string, reason: string) => {
    const res = await apiClient.post(`/organizations/${orgId}/compliance/fiscal-periods/${periodId}/close`, { reason });
    return res.data.data;
  },

  getAuditLogs: async (orgId: string, params?: any) => {
    const res = await apiClient.get(`/organizations/${orgId}/compliance/audit-logs`, { params });
    return { items: res.data.data, pagination: res.data.pagination };
  },
};
