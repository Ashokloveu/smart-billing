import { apiClient } from '../../../services/apiClient';
import {
  DashboardSummary,
  SalesSummary,
  PurchaseSummary,
  InventorySummary,
  ProfitLoss,
  TopSellingResponse,
  OutstandingSummary,
  ReportFilter,
} from '../types/reports';

export const reportService = {
  getDashboardSummary: async (orgId: string): Promise<DashboardSummary> => {
    const res = await apiClient.get(`/organizations/${orgId}/reports/dashboard-summary`);
    return res.data.data;
  },

  getSalesSummary: async (orgId: string, filter?: ReportFilter): Promise<SalesSummary> => {
    const res = await apiClient.get(`/organizations/${orgId}/reports/sales-summary`, { params: filter });
    return res.data.data;
  },

  getPurchaseSummary: async (orgId: string, filter?: ReportFilter): Promise<PurchaseSummary> => {
    const res = await apiClient.get(`/organizations/${orgId}/reports/purchase-summary`, { params: filter });
    return res.data.data;
  },

  getInventorySummary: async (orgId: string, filter?: ReportFilter): Promise<InventorySummary> => {
    const res = await apiClient.get(`/organizations/${orgId}/reports/inventory-summary`, { params: filter });
    return res.data.data;
  },

  getProfitLoss: async (orgId: string, filter?: ReportFilter): Promise<ProfitLoss> => {
    const res = await apiClient.get(`/organizations/${orgId}/reports/profit-loss`, { params: filter });
    return res.data.data;
  },

  getTopSellingItems: async (orgId: string, filter?: ReportFilter): Promise<TopSellingResponse> => {
    const res = await apiClient.get(`/organizations/${orgId}/reports/top-selling-items`, { params: filter });
    return res.data.data;
  },

  getOutstandingSummary: async (orgId: string): Promise<OutstandingSummary> => {
    const res = await apiClient.get(`/organizations/${orgId}/reports/outstanding-summary`);
    return res.data.data;
  },
};
