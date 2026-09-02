import { DecimalOrString } from '../utils/decimal';

export interface TransactionLine {
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: DecimalOrString;
  rate: DecimalOrString;
  grossAmount: DecimalOrString;
  discountAmount: DecimalOrString;
  taxableAmount: DecimalOrString;
  taxRate: DecimalOrString;
  taxAmount: DecimalOrString;
  lineTotal: DecimalOrString;
}

export interface Transaction {
  _id: string;
  organizationId: string;
  firmId: { _id: string; name: string; code: string } | string;
  warehouseId: { _id: string; name: string; code: string } | string;
  financialYearId: string;
  type: 'sale_invoice' | 'pos_invoice' | 'purchase_bill' | 'sales_return' | 'purchase_return';
  status: 'draft' | 'posted' | 'cancelled';
  documentNumber: string;
  date: string;
  bsDate: string;
  dueDate?: string;
  partyId?: { _id: string; name: string; phone?: string; panNumber?: string } | string;
  partyName: string;
  partyPan?: string;
  lines: TransactionLine[];
  subtotal: DecimalOrString;
  totalDiscount: DecimalOrString;
  totalTaxableAmount: DecimalOrString;
  totalTax: DecimalOrString;
  grandTotal: DecimalOrString;
  paidAmount: DecimalOrString;
  balanceDue: DecimalOrString;
  paymentMode: 'cash' | 'credit' | 'bank' | 'partial';
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}
