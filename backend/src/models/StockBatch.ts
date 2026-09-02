import mongoose, { Schema, Document } from 'mongoose';

export interface IStockBatch extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  batchNumber: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  costPrice: mongoose.Types.Decimal128;
  salePrice?: mongoose.Types.Decimal128;
  initialQuantity: mongoose.Types.Decimal128;
  currentQuantity: mongoose.Types.Decimal128;
  barcode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StockBatchSchema = new Schema<IStockBatch>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    batchNumber: { type: String, required: true, trim: true, uppercase: true },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date, index: true },
    costPrice: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    salePrice: { type: Schema.Types.Decimal128 },
    initialQuantity: { type: Schema.Types.Decimal128, required: true },
    currentQuantity: { type: Schema.Types.Decimal128, required: true },
    barcode: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

StockBatchSchema.index({ organizationId: 1, warehouseId: 1, itemId: 1, batchNumber: 1 }, { unique: true });
StockBatchSchema.index({ organizationId: 1, itemId: 1, currentQuantity: 1 });

export const StockBatch = mongoose.model<IStockBatch>('StockBatch', StockBatchSchema);
