import { DecimalOrString } from '../../../utils/decimal';

export interface StockBatch {
  _id: string;
  warehouseId: { _id: string; name: string; code: string } | string;
  itemId: { _id: string; name: string; code: string } | string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate?: string;
  costPrice: DecimalOrString;
  salePrice?: DecimalOrString;
  initialQuantity: DecimalOrString;
  currentQuantity: DecimalOrString;
  barcode?: string;
  isActive: boolean;
}

export interface StockTransfer {
  _id: string;
  transferNumber: string;
  sourceWarehouseId: { _id: string; name: string; code: string };
  destinationWarehouseId: { _id: string; name: string; code: string };
  date: string;
  bsDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'in_transit' | 'received' | 'rejected' | 'cancelled';
  items: Array<{
    itemId: { _id: string; name: string; code: string };
    quantity: DecimalOrString;
    batchNumber?: string;
    costRate: DecimalOrString;
    totalCost: DecimalOrString;
  }>;
  notes?: string;
  createdAt: string;
}

export interface PurchaseRequisition {
  _id: string;
  requisitionNumber: string;
  department: string;
  requestedBy: { _id: string; fullName: string };
  requiredByDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered';
  items: Array<{
    itemId: { _id: string; name: string; code: string };
    quantity: DecimalOrString;
    estimatedRate: DecimalOrString;
    reason?: string;
  }>;
  createdAt: string;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierId: { _id: string; name: string; panNumber?: string };
  supplierName: string;
  supplierPan?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'draft' | 'submitted' | 'approved' | 'issued' | 'partially_received' | 'received' | 'rejected' | 'cancelled';
  items: Array<{
    itemId: { _id: string; name: string; code: string };
    itemName: string;
    quantity: DecimalOrString;
    receivedQuantity: DecimalOrString;
    rate: DecimalOrString;
    taxableAmount: DecimalOrString;
    taxRate: DecimalOrString;
    taxAmount: DecimalOrString;
    totalAmount: DecimalOrString;
  }>;
  subtotal: DecimalOrString;
  taxTotal: DecimalOrString;
  grandTotal: DecimalOrString;
  termsAndConditions?: string;
  createdAt: string;
}

export interface GoodsReceipt {
  _id: string;
  grnNumber: string;
  supplierId: { _id: string; name: string; panNumber?: string };
  warehouseId: { _id: string; name: string; code: string };
  deliveryChallanNumber?: string;
  receivedDate: string;
  status: 'draft' | 'inspected' | 'posted';
  items: Array<{
    itemId: { _id: string; name: string; code: string };
    orderedQuantity: DecimalOrString;
    receivedQuantity: DecimalOrString;
    acceptedQuantity: DecimalOrString;
    rejectedQuantity: DecimalOrString;
    batchNumber?: string;
    expiryDate?: string;
    unitCost: DecimalOrString;
    totalCost: DecimalOrString;
  }>;
  createdAt: string;
}

export interface SalesOrder {
  _id: string;
  soNumber: string;
  customerId: { _id: string; name: string; panNumber?: string; creditLimit?: DecimalOrString; currentBalance?: DecimalOrString };
  customerName: string;
  customerPan?: string;
  quotationNumber?: string;
  orderDate: string;
  deliveryDate?: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'dispatched' | 'invoiced' | 'rejected' | 'cancelled';
  items: Array<{
    itemId: { _id: string; name: string; code: string };
    itemName: string;
    orderedQuantity: DecimalOrString;
    deliveredQuantity: DecimalOrString;
    rate: DecimalOrString;
    discountAmount: DecimalOrString;
    taxableAmount: DecimalOrString;
    taxRate: DecimalOrString;
    taxAmount: DecimalOrString;
    totalAmount: DecimalOrString;
  }>;
  grandTotal: DecimalOrString;
  creditCheckStatus: 'approved' | 'warning' | 'override_required';
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  referenceDocument?: string;
  isRead: boolean;
  createdAt: string;
}
