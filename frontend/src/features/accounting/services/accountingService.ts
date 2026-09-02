import { apiClient } from '../../../services/apiClient';
import {
  Account,
  JournalEntry,
  AccountLedgerResponse,
  DayBookItem,
  TrialBalanceResponse,
  ProfitLossStatement,
  BalanceSheetStatement,
  CashFlowStatement,
  TaxSummaryReport,
} from '../types/accounting';

export const accountingService = {
  // Accounts
  getAccounts: async (orgId: string): Promise<Account[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/accounts`);
    return res.data.data;
  },

  createAccount: async (orgId: string, payload: any): Promise<Account> => {
    const res = await apiClient.post(`/organizations/${orgId}/accounting/accounts`, payload);
    return res.data.data;
  },

  // Journals
  getJournals: async (orgId: string, params?: any): Promise<{ items: JournalEntry[]; pagination: any }> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/journals`, { params });
    return { items: res.data.data, pagination: res.data.pagination };
  },

  createJournal: async (orgId: string, payload: any): Promise<JournalEntry> => {
    const res = await apiClient.post(`/organizations/${orgId}/accounting/journals`, payload);
    return res.data.data;
  },

  submitJournal: async (orgId: string, id: string): Promise<JournalEntry> => {
    const res = await apiClient.post(`/organizations/${orgId}/accounting/journals/${id}/submit`);
    return res.data.data;
  },

  approveJournal: async (orgId: string, id: string): Promise<JournalEntry> => {
    const res = await apiClient.post(`/organizations/${orgId}/accounting/journals/${id}/approve`);
    return res.data.data;
  },

  postJournal: async (orgId: string, id: string): Promise<JournalEntry> => {
    const res = await apiClient.post(`/organizations/${orgId}/accounting/journals/${id}/post`);
    return res.data.data;
  },

  rejectJournal: async (orgId: string, id: string, reason: string): Promise<JournalEntry> => {
    const res = await apiClient.post(`/organizations/${orgId}/accounting/journals/${id}/reject`, { reason });
    return res.data.data;
  },

  reverseJournal: async (orgId: string, id: string, reason: string): Promise<JournalEntry> => {
    const res = await apiClient.post(`/organizations/${orgId}/accounting/journals/${id}/reverse`, { reason });
    return res.data.data;
  },

  // Bulk Opening Balances
  setOpeningBalances: async (orgId: string, entries: any[]): Promise<any> => {
    const res = await apiClient.post(`/organizations/${orgId}/accounting/opening-balances`, { entries });
    return res.data.data;
  },

  // Statements & Reports
  getAccountLedger: async (orgId: string, accountId: string, params?: any): Promise<AccountLedgerResponse> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/ledgers/${accountId}`, { params });
    return res.data.data;
  },

  getDayBook: async (orgId: string, date?: string): Promise<DayBookItem[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/day-book`, { params: { date } });
    return res.data.data;
  },

  getTrialBalance: async (orgId: string): Promise<TrialBalanceResponse> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/trial-balance`);
    return res.data.data;
  },

  getProfitLoss: async (orgId: string): Promise<ProfitLossStatement> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/profit-loss`);
    return res.data.data;
  },

  getBalanceSheet: async (orgId: string): Promise<BalanceSheetStatement> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/balance-sheet`);
    return res.data.data;
  },

  getCashFlow: async (orgId: string): Promise<CashFlowStatement> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/cash-flow`);
    return res.data.data;
  },

  getTaxSummary: async (orgId: string): Promise<TaxSummaryReport> => {
    const res = await apiClient.get(`/organizations/${orgId}/accounting/tax-summary`);
    return res.data.data;
  },
};
