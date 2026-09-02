import mongoose, { Schema, Document } from 'mongoose';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  type: AccountType;
  group: string;
  parentAccountId?: mongoose.Types.ObjectId;
  isSystem: boolean;
  openingBalance: mongoose.Types.Decimal128;
  currentBalance: mongoose.Types.Decimal128;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['asset', 'liability', 'equity', 'income', 'expense'],
      required: true,
      index: true,
    },
    group: { type: String, required: true, trim: true },
    parentAccountId: { type: Schema.Types.ObjectId, ref: 'Account', default: null },
    isSystem: { type: Boolean, default: false },
    openingBalance: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.00'),
    },
    currentBalance: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.00'),
    },
    currency: { type: String, default: 'NPR' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

AccountSchema.index({ organizationId: 1, code: 1 }, { unique: true });
AccountSchema.index({ organizationId: 1, type: 1, group: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
