import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionLine {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  itemCode: string;
  quantity: mongoose.Types.Decimal128;
  rate: mongoose.Types.Decimal128;
  grossAmount: mongoose.Types.Decimal128;
  discountAmount: mongoose.Types.Decimal128;
  taxableAmount: mongoose.Types.Decimal128;
  taxRate: mongoose.Types.Decimal128;
  taxAmount: mongoose.Types.Decimal128;
  lineTotal: mongoose.Types.Decimal128;
}

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  financialYearId: mongoose.Types.ObjectId;
  type: 'sale_invoice' | 'pos_invoice' | 'purchase_bill' | 'sales_return' | 'purchase_return';
  status: 'draft' | 'posted' | 'cancelled';
  documentNumber: string;
  date: Date;
  bsDate: string;
  dueDate?: Date;
  partyId?: mongoose.Types.ObjectId;
  partyName: string;
  partyPan?: string;
  lines: ITransactionLine[];
  subtotal: mongoose.Types.Decimal128;
  totalDiscount: mongoose.Types.Decimal128;
  totalTaxableAmount: mongoose.Types.Decimal128;
  totalTax: mongoose.Types.Decimal128;
  roundOff: mongoose.Types.Decimal128;
  grandTotal: mongoose.Types.Decimal128;
  paidAmount: mongoose.Types.Decimal128;
  balanceDue: mongoose.Types.Decimal128;
  paymentMode: 'cash' | 'credit' | 'bank' | 'partial';
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionLineSchema = new Schema<ITransactionLine>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    itemCode: { type: String, required: true },
    quantity: { type: Schema.Types.Decimal128, required: true },
    rate: { type: Schema.Types.Decimal128, required: true },
    grossAmount: { type: Schema.Types.Decimal128, required: true },
    discountAmount: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    taxableAmount: { type: Schema.Types.Decimal128, required: true },
    taxRate: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('13.00') },
    taxAmount: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    lineTotal: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FiscalPeriod', required: true, index: true },
    type: {
      type: String,
      enum: ['sale_invoice', 'pos_invoice', 'purchase_bill', 'sales_return', 'purchase_return'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'posted', 'cancelled'],
      default: 'draft',
      index: true,
    },
    documentNumber: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now, index: true },
    bsDate: { type: String, required: true },
    dueDate: { type: Date },
    partyId: { type: Schema.Types.ObjectId, ref: 'Party' },
    partyName: { type: String, required: true, trim: true },
    partyPan: { type: String, trim: true },
    lines: [TransactionLineSchema],
    subtotal: { type: Schema.Types.Decimal128, required: true },
    totalDiscount: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    totalTaxableAmount: { type: Schema.Types.Decimal128, required: true },
    totalTax: { type: Schema.Types.Decimal128, required: true },
    roundOff: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    grandTotal: { type: Schema.Types.Decimal128, required: true },
    paidAmount: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    balanceDue: { type: Schema.Types.Decimal128, required: true },
    paymentMode: { type: String, enum: ['cash', 'credit', 'bank', 'partial'], default: 'credit' },
    notes: { type: String },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ organizationId: 1, documentNumber: 1 }, { unique: true });
TransactionSchema.index({ organizationId: 1, type: 1, status: 1, date: -1 });
TransactionSchema.index({ organizationId: 1, partyId: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
