import { apiClient } from '../../../services/apiClient';
import { Lead, Opportunity, Quotation, Customer360, SalesTarget } from '../types/crm';

export const crmService = {
  // Duplicates
  checkDuplicates: async (orgId: string, params: { phone?: string; email?: string; panNumber?: string }) => {
    const res = await apiClient.get(`/organizations/${orgId}/crm/duplicates`, { params });
    return res.data.data;
  },

  // Leads
  getLeads: async (orgId: string, params?: any): Promise<{ items: Lead[]; total: number; page: number; totalPages: number }> => {
    const res = await apiClient.get(`/organizations/${orgId}/crm/leads`, { params });
    return res.data.data;
  },

  createLead: async (orgId: string, payload: any): Promise<Lead> => {
    const res = await apiClient.post(`/organizations/${orgId}/crm/leads`, payload);
    return res.data.data;
  },

  convertLead: async (orgId: string, id: string): Promise<{ customer: any; opportunity: any }> => {
    const res = await apiClient.post(`/organizations/${orgId}/crm/leads/${id}/convert`);
    return res.data.data;
  },

  // Customer 360
  getCustomer360: async (orgId: string, customerId: string): Promise<Customer360> => {
    const res = await apiClient.get(`/organizations/${orgId}/crm/customers/${customerId}/360`);
    return res.data.data;
  },

  // Quotations
  getQuotations: async (orgId: string, params?: any): Promise<Quotation[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/crm/quotations`, { params });
    return res.data.data;
  },

  createQuotation: async (orgId: string, payload: any): Promise<Quotation> => {
    const res = await apiClient.post(`/organizations/${orgId}/crm/quotations`, payload);
    return res.data.data;
  },

  convertToSalesOrder: async (orgId: string, id: string) => {
    const res = await apiClient.post(`/organizations/${orgId}/crm/quotations/${id}/convert-to-order`);
    return res.data.data;
  },

  // Opportunities
  getOpportunities: async (orgId: string): Promise<Opportunity[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/crm/opportunities`);
    return res.data.data;
  },

  createOpportunity: async (orgId: string, payload: any): Promise<Opportunity> => {
    const res = await apiClient.post(`/organizations/${orgId}/crm/opportunities`, payload);
    return res.data.data;
  },

  updateOpportunityStage: async (orgId: string, id: string, stage: string): Promise<Opportunity> => {
    const res = await apiClient.patch(`/organizations/${orgId}/crm/opportunities/${id}/stage`, { stage });
    return res.data.data;
  },

  // Activities & Targets
  recordActivity: async (orgId: string, payload: any) => {
    const res = await apiClient.post(`/organizations/${orgId}/crm/activities`, payload);
    return res.data.data;
  },

  getSalesTargets: async (orgId: string): Promise<SalesTarget[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/crm/targets`);
    return res.data.data;
  },

  createSalesTarget: async (orgId: string, payload: any): Promise<SalesTarget> => {
    const res = await apiClient.post(`/organizations/${orgId}/crm/targets`, payload);
    return res.data.data;
  },
};
