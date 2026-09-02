import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseRequisitionItem {
  itemId: mongoose.Types.ObjectId;
  quantity: mongoose.Types.Decimal128;
  estimatedRate: mongoose.Types.Decimal128;
  reason?: string;
}

export interface IPurchaseRequisition extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  requisitionNumber: string;
  department: string;
  requestedBy: mongoose.Types.ObjectId;
  requiredByDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered';
  items: IPurchaseRequisitionItem[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequisitionItemSchema = new Schema<IPurchaseRequisitionItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: { type: Schema.Types.Decimal128, required: true },
    estimatedRate: { type: Schema.Types.Decimal128, required: true },
    reason: { type: String, trim: true },
  },
  { _id: false }
);

const PurchaseRequisitionSchema = new Schema<IPurchaseRequisition>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    requisitionNumber: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requiredByDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'ordered'],
      default: 'draft',
      index: true,
    },
    items: [PurchaseRequisitionItemSchema],
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

PurchaseRequisitionSchema.index({ organizationId: 1, requisitionNumber: 1 }, { unique: true });

export const PurchaseRequisition = mongoose.model<IPurchaseRequisition>(
  'PurchaseRequisition',
  PurchaseRequisitionSchema
);
