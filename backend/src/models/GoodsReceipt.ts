import mongoose, { Schema, Document } from 'mongoose';

export interface IGoodsReceiptItem {
  itemId: mongoose.Types.ObjectId;
  orderedQuantity: mongoose.Types.Decimal128;
  receivedQuantity: mongoose.Types.Decimal128;
  acceptedQuantity: mongoose.Types.Decimal128;
  rejectedQuantity: mongoose.Types.Decimal128;
  batchNumber?: string;
  expiryDate?: Date;
  unitCost: mongoose.Types.Decimal128;
  totalCost: mongoose.Types.Decimal128;
}

export interface IGoodsReceipt extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  grnNumber: string;
  purchaseOrderId?: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  deliveryChallanNumber?: string;
  receivedDate: Date;
  status: 'draft' | 'inspected' | 'posted';
  items: IGoodsReceiptItem[];
  inspectedBy?: mongoose.Types.ObjectId;
  receivedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoodsReceiptItemSchema = new Schema<IGoodsReceiptItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    orderedQuantity: { type: Schema.Types.Decimal128, required: true },
    receivedQuantity: { type: Schema.Types.Decimal128, required: true },
    acceptedQuantity: { type: Schema.Types.Decimal128, required: true },
    rejectedQuantity: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date },
    unitCost: { type: Schema.Types.Decimal128, required: true },
    totalCost: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const GoodsReceiptSchema = new Schema<IGoodsReceipt>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    grnNumber: { type: String, required: true, trim: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    deliveryChallanNumber: { type: String, trim: true },
    receivedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['draft', 'inspected', 'posted'], default: 'draft', index: true },
    items: [GoodsReceiptItemSchema],
    inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

GoodsReceiptSchema.index({ organizationId: 1, grnNumber: 1 }, { unique: true });

export const GoodsReceipt = mongoose.model<IGoodsReceipt>('GoodsReceipt', GoodsReceiptSchema);
