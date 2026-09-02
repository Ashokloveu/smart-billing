import { DecimalOrString } from '../../../utils/decimal';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  _id: string;
  organizationId: string;
  code: string;
  name: string;
  type: AccountType;
  group: string;
  parentAccountId?: string;
  isSystem: boolean;
  openingBalance: DecimalOrString;
  currentBalance: DecimalOrString;
  currency: string;
  isActive: boolean;
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  partyId?: string;
  debit: DecimalOrString;
  credit: DecimalOrString;
  baseDebit: DecimalOrString;
  baseCredit: DecimalOrString;
  narration?: string;
}

export interface JournalEntry {
  _id: string;
  organizationId: string;
  firmId: string;
  financialYearId: string;
  entryNumber: string;
  date: string;
  bsDate: string;
  narration: string;
  status: 'draft' | 'submitted' | 'approved' | 'posted' | 'rejected' | 'reversed' | 'cancelled';
  sourceModule: string;
  sourceDocumentId?: string;
  sourceDocumentNumber?: string;
  currency: string;
  exchangeRate: DecimalOrString;
  lines: JournalLine[];
  totalDebit: DecimalOrString;
  totalCredit: DecimalOrString;
  attachments?: string[];
  reversalOf?: string;
  reversedBy?: string;
  reversalReason?: string;
  createdBy: { _id: string; fullName: string } | string;
  createdAt: string;
}

export interface AccountLedgerItem {
  date: string;
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
