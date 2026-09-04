import { apiClient } from '../../../services/apiClient';

export const treasuryService = {
  getAccounts: async (orgId: string) => (await apiClient.get(`/organizations/${orgId}/treasury/accounts`)).data.data,
  createAccount: async (orgId: string, payload: unknown) => (await apiClient.post(`/organizations/${orgId}/treasury/accounts`, payload)).data.data,
  getTransfers: async (orgId: string) => (await apiClient.get(`/organizations/${orgId}/treasury/transfers`)).data.data,
  createTransfer: async (orgId: string, payload: unknown) => (await apiClient.post(`/organizations/${orgId}/treasury/transfers`, payload)).data.data,
  getCheques: async (orgId: string) => (await apiClient.get(`/organizations/${orgId}/treasury/cheques`)).data.data,
  createCheque: async (orgId: string, payload: unknown) => (await apiClient.post(`/organizations/${orgId}/treasury/cheques`, payload)).data.data,
  updateChequeStatus: async (orgId: string, chequeId: string, status: string) =>
    (await apiClient.patch(`/organizations/${orgId}/treasury/cheques/${chequeId}/status`, { status })).data.data,
  getLedger: async (orgId: string, accountId: string) =>
    (await apiClient.get(`/organizations/${orgId}/treasury/accounts/${accountId}/ledger`)).data.data,
  setReconciled: async (orgId: string, accountId: string, journalId: string, reconciled: boolean) =>
    (await apiClient.put(`/organizations/${orgId}/treasury/accounts/${accountId}/reconciliation/${journalId}`, { reconciled })).data.data,
};
