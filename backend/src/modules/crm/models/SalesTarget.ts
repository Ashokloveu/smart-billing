import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesTarget extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  periodType: 'monthly' | 'quarterly';
  periodName: string;
  targetAmount: mongoose.Types.Decimal128;
  achievedAmount: mongoose.Types.Decimal128;
  status: 'in_progress' | 'achieved' | 'missed';
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SalesTargetSchema = new Schema<ISalesTarget>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    periodType: { type: String, enum: ['monthly', 'quarterly'], default: 'monthly' },
    periodName: { type: String, required: true, trim: true },
    targetAmount: { type: Schema.Types.Decimal128, required: true },
    achievedAmount: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    status: { type: String, enum: ['in_progress', 'achieved', 'missed'], default: 'in_progress' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

SalesTargetSchema.index({ organizationId: 1, userId: 1, periodName: 1 }, { unique: true });

export const SalesTarget = mongoose.model<ISalesTarget>('SalesTarget', SalesTargetSchema);
