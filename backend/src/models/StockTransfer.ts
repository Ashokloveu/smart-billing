import mongoose, { Schema, Document } from 'mongoose';

export interface IStockTransferItem {
  itemId: mongoose.Types.ObjectId;
  quantity: mongoose.Types.Decimal128;
  batchNumber?: string;
  costRate: mongoose.Types.Decimal128;
  totalCost: mongoose.Types.Decimal128;
}

export interface IStockTransfer extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  transferNumber: string;
  sourceWarehouseId: mongoose.Types.ObjectId;
  destinationWarehouseId: mongoose.Types.ObjectId;
  date: Date;
  bsDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'in_transit' | 'received' | 'rejected' | 'cancelled';
  items: IStockTransferItem[];
  submittedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  dispatchedBy?: mongoose.Types.ObjectId;
  dispatchedAt?: Date;
  receivedBy?: mongoose.Types.ObjectId;
  receivedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockTransferItemSchema = new Schema<IStockTransferItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: { type: Schema.Types.Decimal128, required: true },
    batchNumber: { type: String, trim: true },
    costRate: { type: Schema.Types.Decimal128, required: true },
    totalCost: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const StockTransferSchema = new Schema<IStockTransfer>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    transferNumber: { type: String, required: true, trim: true },
    sourceWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    destinationWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    bsDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'in_transit', 'received', 'rejected', 'cancelled'],
      default: 'draft',
      index: true,
    },
    items: [StockTransferItemSchema],
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dispatchedAt: { type: Date },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

StockTransferSchema.index({ organizationId: 1, transferNumber: 1 }, { unique: true });
StockTransferSchema.index({ organizationId: 1, status: 1, date: -1 });

export const StockTransfer = mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
