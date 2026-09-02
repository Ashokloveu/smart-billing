import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  transactionId?: mongoose.Types.ObjectId;
  documentNumber?: string;
  type: 'opening' | 'purchase' | 'sale' | 'sale_return' | 'purchase_return' | 'adjustment' | 'transfer_in' | 'transfer_out';
  direction: 'IN' | 'OUT';
  quantity: mongoose.Types.Decimal128;
  costRate: mongoose.Types.Decimal128;
  totalCost: mongoose.Types.Decimal128;
  date: Date;
  bsDate?: string;
  remarks?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, default: null },
    documentNumber: { type: String, trim: true },
    type: {
      type: String,
      enum: ['opening', 'purchase', 'sale', 'sale_return', 'purchase_return', 'adjustment', 'transfer_in', 'transfer_out'],
      required: true,
      index: true,
    },
    direction: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Schema.Types.Decimal128, required: true },
    costRate: { type: Schema.Types.Decimal128, required: true },
    totalCost: { type: Schema.Types.Decimal128, required: true },
    date: { type: Date, default: Date.now, index: true },
    bsDate: { type: String },
    remarks: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

StockMovementSchema.index({ organizationId: 1, itemId: 1, warehouseId: 1, date: -1 });
StockMovementSchema.index({ organizationId: 1, transactionId: 1 });
StockMovementSchema.index({ organizationId: 1, type: 1, date: -1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
