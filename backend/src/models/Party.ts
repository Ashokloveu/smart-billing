import mongoose, { Schema, Document } from 'mongoose';

export interface IParty extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  type: 'customer' | 'supplier' | 'both';
  name: string;
  panNumber?: string;
  email?: string;
  phone: string;
  billingAddress: {
    line1: string;
    city: string;
    district: string;
    province: string;
  };
  creditLimit: mongoose.Types.Decimal128;
  openingBalance: {
    amount: mongoose.Types.Decimal128;
    date: Date;
  };
  currentBalance: mongoose.Types.Decimal128;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const PartySchema = new Schema<IParty>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, enum: ['customer', 'supplier', 'both'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    panNumber: { type: String, trim: true, match: /^[0-9]{9}$/ },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    billingAddress: {
      line1: { type: String, default: '' },
      city: { type: String, required: true },
      district: { type: String, required: true },
      province: { type: String, required: true },
    },
    creditLimit: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    openingBalance: {
      amount: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
      date: { type: Date, default: Date.now },
    },
    currentBalance: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

PartySchema.index({ organizationId: 1, type: 1, name: 1 });
PartySchema.index({ organizationId: 1, phone: 1 });
PartySchema.index({ organizationId: 1, panNumber: 1 }, { sparse: true });

export const Party = mongoose.model<IParty>('Party', PartySchema);
