import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxPolicy extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  jurisdiction: string;
  taxType: 'VAT' | 'EXCISE' | 'NON_TAXABLE';
  rate: mongoose.Types.Decimal128;
  isInclusive: boolean;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaxPolicySchema = new Schema<ITaxPolicy>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    jurisdiction: { type: String, required: true, default: 'NP' },
    taxType: { type: String, enum: ['VAT', 'EXCISE', 'NON_TAXABLE'], required: true, default: 'VAT' },
    rate: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('13.00') },
    isInclusive: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

TaxPolicySchema.index({ organizationId: 1, name: 1, version: -1 });

export const TaxPolicy = mongoose.model<ITaxPolicy>('TaxPolicy', TaxPolicySchema);
