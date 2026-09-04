import mongoose, { Document, Schema } from 'mongoose';

export type TreasuryAccountType = 'bank' | 'cash' | 'ewallet';

export interface ITreasuryAccount extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  ledgerAccountId: mongoose.Types.ObjectId;
  name: string;
  type: TreasuryAccountType;
  accountNumber?: string;
  bankName?: string;
  branch?: string;
  color: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TreasuryAccountSchema = new Schema<ITreasuryAccount>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  ledgerAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: ['bank', 'cash', 'ewallet'], required: true, index: true },
  accountNumber: { type: String, trim: true, maxlength: 50 },
  bankName: { type: String, trim: true, maxlength: 120 },
  branch: { type: String, trim: true, maxlength: 120 },
  color: { type: String, default: '#2563eb', match: /^#[0-9a-fA-F]{6}$/ },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

TreasuryAccountSchema.index({ organizationId: 1, ledgerAccountId: 1 }, { unique: true });
TreasuryAccountSchema.index(
  { organizationId: 1, accountNumber: 1 },
  { unique: true, partialFilterExpression: { accountNumber: { $type: 'string' }, isActive: true } }
);

export const TreasuryAccount = mongoose.model<ITreasuryAccount>('TreasuryAccount', TreasuryAccountSchema);
