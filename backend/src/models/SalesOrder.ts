import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesOrderItem {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  orderedQuantity: mongoose.Types.Decimal128;
  deliveredQuantity: mongoose.Types.Decimal128;
  rate: mongoose.Types.Decimal128;
  discountAmount: mongoose.Types.Decimal128;
  taxableAmount: mongoose.Types.Decimal128;
  taxRate: mongoose.Types.Decimal128;
  taxAmount: mongoose.Types.Decimal128;
  totalAmount: mongoose.Types.Decimal128;
}

export interface ISalesOrder extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  financialYearId: mongoose.Types.ObjectId;
  soNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPan?: string;
  quotationNumber?: string;
  orderDate: Date;
  deliveryDate?: Date;
  status: 'draft' | 'submitted' | 'confirmed' | 'dispatched' | 'invoiced' | 'rejected' | 'cancelled';
  items: ISalesOrderItem[];
  subtotal: mongoose.Types.Decimal128;
  taxTotal: mongoose.Types.Decimal128;
  grandTotal: mongoose.Types.Decimal128;
  creditCheckStatus: 'approved' | 'warning' | 'override_required';
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SalesOrderItemSchema = new Schema<ISalesOrderItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    orderedQuantity: { type: Schema.Types.Decimal128, required: true },
    deliveredQuantity: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    rate: { type: Schema.Types.Decimal128, required: true },
    discountAmount: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    taxableAmount: { type: Schema.Types.Decimal128, required: true },
    taxRate: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('13.00') },
    taxAmount: { type: Schema.Types.Decimal128, required: true },
    totalAmount: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const SalesOrderSchema = new Schema<ISalesOrder>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FiscalPeriod', required: true, index: true },
    soNumber: { type: String, required: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    customerName: { type: String, required: true },
    customerPan: { type: String },
    quotationNumber: { type: String, trim: true },
    orderDate: { type: Date, default: Date.now, index: true },
    deliveryDate: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'confirmed', 'dispatched', 'invoiced', 'rejected', 'cancelled'],
      default: 'draft',
      index: true,
    },
    items: [SalesOrderItemSchema],
    subtotal: { type: Schema.Types.Decimal128, required: true },
    taxTotal: { type: Schema.Types.Decimal128, required: true },
    grandTotal: { type: Schema.Types.Decimal128, required: true },
    creditCheckStatus: {
      type: String,
      enum: ['approved', 'warning', 'override_required'],
      default: 'approved',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

SalesOrderSchema.index({ organizationId: 1, soNumber: 1 }, { unique: true });
SalesOrderSchema.index({ organizationId: 1, customerId: 1 });

export const SalesOrder = mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);
