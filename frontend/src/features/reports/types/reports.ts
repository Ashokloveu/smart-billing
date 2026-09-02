export interface DashboardSummary {
  totalSales: number;
  totalPurchase: number;
  totalProfit: number;
  totalInvoices: number;
  totalCustomers: number;
  totalSuppliers: number;
  inventoryValuation: number;
  lowStockCount: number;
}

export interface TrendDataPoint {
  month?: string;
  date?: string;
  year?: number;
  amount: number;
  count: number;
}

export interface SalesSummary {
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  daily: TrendDataPoint[];
  monthly: TrendDataPoint[];
  yearly: TrendDataPoint[];
  byItem: Array<{ itemId: string; itemName: string; itemCode: string; quantity: number; revenue: number }>;
  byCategory: Array<{ categoryId: string; categoryName: string; revenue: number }>;
  byCustomer: Array<{ partyId: string; partyName: string; revenue: number; invoiceCount: number }>;
}

export interface PurchaseSummary {
  totalPurchase: number;
  trends: TrendDataPoint[];
  supplierWise: Array<{ supplierId: string; supplierName: string; amount: number; billCount: number }>;
  itemWise: Array<{ itemId: string; itemName: string; itemCode: string; quantity: number; cost: number }>;
}

export interface InventorySummary {
  totalStockQuantity: number;
  stockValuation: number;
  warehouseWise: Array<{ warehouseId: string; warehouseName: string; totalQuantity: number; valuation: number }>;
  lowStockItems: Array<{ itemId: string; name: string; code: string; currentQuantity: number; minimumStock: number; deficit: number }>;
  deadStockItems: Array<{ itemId: string; name: string; code: string; currentQuantity: number; lastMovementDate?: string }>;
}

export interface ProfitLoss {
  salesRevenue: number;
  purchaseCost: number;
  grossProfit: number;
  profitPercentage: number;
}

export interface TopSellingItem {
  itemId: string;
  name: string;
  code: string;
  quantitySold: number;
  revenue: number;
}

export interface TopSellingResponse {
  byQuantity: TopSellingItem[];
  byRevenue: TopSellingItem[];
}

export interface OutstandingParty {
  partyId: string;
  name: string;
  phone?: string;
  balance: number;
}

export interface OutstandingSummary {
  customerReceivable: number;
  supplierPayable: number;
  topReceivables: OutstandingParty[];
  topPayables: OutstandingParty[];
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  customerId?: string;
  supplierId?: string;
}
