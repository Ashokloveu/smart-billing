import mongoose, { Schema, Document } from 'mongoose';

export interface IFiscalPeriod extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  label: string;
  startDate: Date;
  endDate: Date;
  bsStartDate: string;
  bsEndDate: string;
  isClosed: boolean;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FiscalPeriodSchema = new Schema<IFiscalPeriod>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    label: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    bsStartDate: { type: String, required: true },
    bsEndDate: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
    isCurrent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

FiscalPeriodSchema.index({ organizationId: 1, label: 1 }, { unique: true });
FiscalPeriodSchema.index({ organizationId: 1, isCurrent: 1 });

export const FiscalPeriod = mongoose.model<IFiscalPeriod>('FiscalPeriod', FiscalPeriodSchema);
