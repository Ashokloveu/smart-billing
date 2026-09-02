import mongoose, { Schema, Document } from 'mongoose';

export interface IStockBalance extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  quantity: mongoose.Types.Decimal128;
  averageCost: mongoose.Types.Decimal128;
  totalValuation: mongoose.Types.Decimal128;
  lastMovementDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockBalanceSchema = new Schema<IStockBalance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    quantity: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    averageCost: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    totalValuation: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    lastMovementDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

StockBalanceSchema.index({ organizationId: 1, warehouseId: 1, itemId: 1 }, { unique: true });
StockBalanceSchema.index({ organizationId: 1, itemId: 1 });
StockBalanceSchema.index({ organizationId: 1, warehouseId: 1 });

export const StockBalance = mongoose.model<IStockBalance>('StockBalance', StockBalanceSchema);
