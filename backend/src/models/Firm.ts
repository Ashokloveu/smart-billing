import mongoose, { Schema, Document } from 'mongoose';

export interface IFirm extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  isHeadOffice: boolean;
  address: {
    line1: string;
    city: string;
    district: string;
    province: string;
  };
  phone: string;
  email?: string;
  signatureUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FirmSchema = new Schema<IFirm>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    isHeadOffice: { type: Boolean, default: false },
    address: {
      line1: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      province: { type: String, required: true },
    },
    phone: { type: String, required: true },
    email: { type: String },
    signatureUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

FirmSchema.index({ organizationId: 1, code: 1 }, { unique: true });
FirmSchema.index({ organizationId: 1, isHeadOffice: 1 });

export const Firm = mongoose.model<IFirm>('Firm', FirmSchema);
