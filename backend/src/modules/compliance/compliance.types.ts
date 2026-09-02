export interface VatRegisterQuery {
  startDate?: string;
  endDate?: string;
  firmId?: string;
  page?: number;
  limit?: number;
}

export interface VatSalesRegisterRow {
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
}

export interface VatSalesRegisterResponse {
  organizationName: string;
  organizationPan: string;
  periodLabel: string;
  rows: VatSalesRegisterRow[];
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

export interface VatPurchaseRegisterRow {
  date: string;
  bsDate: string;
  documentNumber: string;
  supplierName: string;
  supplierPan?: string;
  totalPurchases: number;
  exemptPurchases: number;
  taxablePurchases: number;
  vatPaid: number;
}

export interface VatPurchaseRegisterResponse {
  organizationName: string;
  organizationPan: string;
  periodLabel: string;
  rows: VatPurchaseRegisterRow[];
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

export interface InvoiceComplianceCheck {
  documentNumber: string;
  isCompliant: boolean;
  issues: string[];
  sellerPanValid: boolean;
  buyerPanPresent: boolean;
  consecutiveSequenceValid: boolean;
  qrPayload: string;
}

export interface DocumentSequenceConfigDTO {
  firmId: string;
  financialYearId: string;
  type: string; // 'sale_invoice', 'pos_invoice', 'purchase_bill', 'journal_entry'
  prefix: string;
  nextNumber?: number;
}

export interface CloseFiscalPeriodDTO {
  reason: string;
}
