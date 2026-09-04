import mongoose, { Document, Schema } from 'mongoose';

export interface IFundTransfer extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  transferNumber: string;
  fromAccountId: mongoose.Types.ObjectId;
  toAccountId: mongoose.Types.ObjectId;
  amount: mongoose.Types.Decimal128;
  date: Date;
  bsDate: string;
  narration: string;
  journalEntryId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FundTransferSchema = new Schema<IFundTransfer>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  transferNumber: { type: String, required: true },
  fromAccountId: { type: Schema.Types.ObjectId, ref: 'TreasuryAccount', required: true },
  toAccountId: { type: Schema.Types.ObjectId, ref: 'TreasuryAccount', required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  date: { type: Date, required: true, index: true },
  bsDate: { type: String, required: true },
  narration: { type: String, required: true, trim: true },
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

FundTransferSchema.index({ organizationId: 1, transferNumber: 1 }, { unique: true });
FundTransferSchema.index({ organizationId: 1, date: -1 });

export const FundTransfer = mongoose.model<IFundTransfer>('FundTransfer', FundTransferSchema);
