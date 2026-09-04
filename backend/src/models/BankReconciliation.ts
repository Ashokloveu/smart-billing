import mongoose, { Document, Schema } from 'mongoose';

export interface IBankReconciliation extends Document {
  organizationId: mongoose.Types.ObjectId;
  treasuryAccountId: mongoose.Types.ObjectId;
  journalEntryId: mongoose.Types.ObjectId;
  reconciledAt: Date;
  reconciledBy: mongoose.Types.ObjectId;
}

const BankReconciliationSchema = new Schema<IBankReconciliation>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  treasuryAccountId: { type: Schema.Types.ObjectId, ref: 'TreasuryAccount', required: true },
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
  reconciledAt: { type: Date, required: true, default: Date.now },
  reconciledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: false });

BankReconciliationSchema.index(
  { organizationId: 1, treasuryAccountId: 1, journalEntryId: 1 },
  { unique: true }
);

export const BankReconciliation = mongoose.model<IBankReconciliation>('BankReconciliation', BankReconciliationSchema);
