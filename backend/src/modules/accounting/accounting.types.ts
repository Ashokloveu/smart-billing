export interface CreateAccountDTO {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  group: string;
  parentAccountId?: string;
  openingBalance?: string;
  currency?: string;
}

export interface JournalLineDTO {
  accountId: string;
  partyId?: string;
  debit: string;
  credit: string;
  narration?: string;
}

export interface CreateJournalEntryDTO {
  firmId: string;
  financialYearId: string;
  date?: string;
  bsDate: string;
  narration: string;
  status?: 'draft' | 'posted';
  sourceModule?: 'manual' | 'sales' | 'purchase' | 'pos' | 'payment' | 'inventory' | 'expense' | 'treasury';
  sourceDocumentId?: string;
  sourceDocumentNumber?: string;
  currency?: string;
  exchangeRate?: string;
  lines: JournalLineDTO[];
  attachments?: string[];
}

export interface OpeningBalanceEntryDTO {
  accountId: string;
  openingBalance: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
}

export interface BulkOpeningBalanceDTO {
  entries: OpeningBalanceEntryDTO[];
}

export interface AccountLedgerItem {
  date: Date;
  bsDate: string;
  entryNumber: string;
  narration: string;
  sourceModule: string;
  sourceDocumentNumber?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface AccountLedgerResponse {
  account: {
    _id: string;
    code: string;
    name: string;
    type: string;
    group: string;
  };
  openingBalance: number;
  closingBalance: number;
  items: AccountLedgerItem[];
}

export interface DayBookItem {
  entryNumber: string;
  time: string;
  narration: string;
  sourceModule: string;
  sourceDocumentNumber?: string;
  status: string;
  totalAmount: number;
  lines: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  group: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceResponse {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface ProfitLossStatement {
  income: Array<{ group: string; accounts: Array<{ code: string; name: string; amount: number }>; subtotal: number }>;
  expenses: Array<{ group: string; accounts: Array<{ code: string; name: string; amount: number }>; subtotal: number }>;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export interface BalanceSheetStatement {
  assets: Array<{ group: string; accounts: Array<{ code: string; name: string; amount: number }>; subtotal: number }>;
  liabilities: Array<{ group: string; accounts: Array<{ code: string; name: string; amount: number }>; subtotal: number }>;
  equity: Array<{ group: string; accounts: Array<{ code: string; name: string; amount: number }>; subtotal: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

export interface CashFlowStatement {
  operatingActivities: Array<{ title: string; amount: number }>;
  investingActivities: Array<{ title: string; amount: number }>;
  financingActivities: Array<{ title: string; amount: number }>;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
}

export interface TaxSummaryReport {
  taxableSales: number;
  exemptSales: number;
  outputVatCollected: number;
  taxablePurchases: number;
  exemptPurchases: number;
  inputVatClaimable: number;
  netVatPayable: number;
  tdsWithheldPayable: number;
}
