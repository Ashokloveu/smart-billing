import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderItem {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  quantity: mongoose.Types.Decimal128;
  receivedQuantity: mongoose.Types.Decimal128;
  rate: mongoose.Types.Decimal128;
  taxableAmount: mongoose.Types.Decimal128;
  taxRate: mongoose.Types.Decimal128;
  taxAmount: mongoose.Types.Decimal128;
  totalAmount: mongoose.Types.Decimal128;
}

export interface IPurchaseOrder extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  financialYearId: mongoose.Types.ObjectId;
  poNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  supplierPan?: string;
  requisitionId?: mongoose.Types.ObjectId;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  status: 'draft' | 'submitted' | 'approved' | 'issued' | 'partially_received' | 'received' | 'rejected' | 'cancelled';
  items: IPurchaseOrderItem[];
  subtotal: mongoose.Types.Decimal128;
  taxTotal: mongoose.Types.Decimal128;
  grandTotal: mongoose.Types.Decimal128;
  termsAndConditions?: string;
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    quantity: { type: Schema.Types.Decimal128, required: true },
    receivedQuantity: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    rate: { type: Schema.Types.Decimal128, required: true },
    taxableAmount: { type: Schema.Types.Decimal128, required: true },
    taxRate: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('13.00') },
    taxAmount: { type: Schema.Types.Decimal128, required: true },
    totalAmount: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FiscalPeriod', required: true, index: true },
    poNumber: { type: String, required: true, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    supplierName: { type: String, required: true },
    supplierPan: { type: String },
    requisitionId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
    orderDate: { type: Date, default: Date.now, index: true },
    expectedDeliveryDate: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'issued', 'partially_received', 'received', 'rejected', 'cancelled'],
      default: 'draft',
      index: true,
    },
    items: [PurchaseOrderItemSchema],
    subtotal: { type: Schema.Types.Decimal128, required: true },
    taxTotal: { type: Schema.Types.Decimal128, required: true },
    grandTotal: { type: Schema.Types.Decimal128, required: true },
    termsAndConditions: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

PurchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ organizationId: 1, supplierId: 1 });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
