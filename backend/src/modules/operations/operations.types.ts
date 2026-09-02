export interface StockTransferDTO {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  date?: string;
  bsDate: string;
  notes?: string;
  items: Array<{
    itemId: string;
    quantity: string | number;
    batchNumber?: string;
  }>;
}

export interface StockBatchDTO {
  warehouseId: string;
  itemId: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate?: string;
  costPrice: string | number;
  salePrice?: string | number;
  initialQuantity: string | number;
  barcode?: string;
}

export interface PurchaseRequisitionDTO {
  department: string;
  requiredByDate: string;
  items: Array<{
    itemId: string;
    quantity: string | number;
    estimatedRate: string | number;
    reason?: string;
  }>;
}

export interface PurchaseOrderDTO {
  firmId: string;
  financialYearId: string;
  supplierId: string;
  requisitionId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  termsAndConditions?: string;
  items: Array<{
    itemId: string;
    quantity: string | number;
    rate: string | number;
  }>;
}

export interface GoodsReceiptDTO {
  purchaseOrderId?: string;
  supplierId: string;
  warehouseId: string;
  deliveryChallanNumber?: string;
  receivedDate?: string;
  notes?: string;
  items: Array<{
    itemId: string;
    orderedQuantity: string | number;
    receivedQuantity: string | number;
    acceptedQuantity: string | number;
    rejectedQuantity?: string | number;
    batchNumber?: string;
    expiryDate?: string;
    unitCost: string | number;
  }>;
}

export interface SalesOrderDTO {
  firmId: string;
  financialYearId: string;
  customerId: string;
  quotationNumber?: string;
  orderDate?: string;
  deliveryDate?: string;
  items: Array<{
    itemId: string;
    orderedQuantity: string | number;
    rate: string | number;
    discountAmount?: string | number;
  }>;
}

export interface StockAdjustmentDTO {
  warehouseId: string;
  itemId: string;
  adjustmentType: 'positive' | 'negative';
  quantity: string | number;
  costRate: string | number;
  reason: string;
  batchNumber?: string;
}
