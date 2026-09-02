export interface ReportFilterQuery {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  customerId?: string;
  supplierId?: string;
}

export interface DashboardSummaryResponse {
  totalSales: number;
  totalPurchase: number;
  totalProfit: number;
  totalInvoices: number;
  totalCustomers: number;
  totalSuppliers: number;
  inventoryValuation: number;
  lowStockCount: number;
}

export interface SalesSummaryResponse {
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  daily: Array<{ date: string; amount: number; count: number }>;
  monthly: Array<{ month: string; amount: number; count: number }>;
  yearly: Array<{ year: number; amount: number; count: number }>;
  byItem: Array<{ itemId: string; itemName: string; itemCode: string; quantity: number; revenue: number }>;
  byCategory: Array<{ categoryId: string; categoryName: string; revenue: number }>;
  byCustomer: Array<{ partyId: string; partyName: string; revenue: number; invoiceCount: number }>;
}

export interface PurchaseSummaryResponse {
  totalPurchase: number;
  trends: Array<{ month: string; amount: number; count: number }>;
  supplierWise: Array<{ supplierId: string; supplierName: string; amount: number; billCount: number }>;
  itemWise: Array<{ itemId: string; itemName: string; itemCode: string; quantity: number; cost: number }>;
}

export interface InventorySummaryResponse {
  totalStockQuantity: number;
  stockValuation: number;
  warehouseWise: Array<{ warehouseId: string; warehouseName: string; totalQuantity: number; valuation: number }>;
  lowStockItems: Array<{ itemId: string; name: string; code: string; currentQuantity: number; minimumStock: number; deficit: number }>;
  deadStockItems: Array<{ itemId: string; name: string; code: string; currentQuantity: number; lastMovementDate?: Date }>;
}

export interface ProfitLossResponse {
  salesRevenue: number;
  purchaseCost: number;
  grossProfit: number;
  profitPercentage: number;
}

export interface TopSellingItemResponse {
  byQuantity: Array<{ itemId: string; name: string; code: string; quantitySold: number; revenue: number }>;
  byRevenue: Array<{ itemId: string; name: string; code: string; quantitySold: number; revenue: number }>;
}

export interface OutstandingSummaryResponse {
  customerReceivable: number;
  supplierPayable: number;
  topReceivables: Array<{ partyId: string; name: string; phone?: string; balance: number }>;
  topPayables: Array<{ partyId: string; name: string; phone?: string; balance: number }>;
}
