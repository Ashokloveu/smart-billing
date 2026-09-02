import mongoose, { Schema, Document } from 'mongoose';

export type JournalStatus = 'draft' | 'submitted' | 'approved' | 'posted' | 'rejected' | 'reversed' | 'cancelled';
export type JournalSourceModule = 'manual' | 'sales' | 'purchase' | 'pos' | 'payment' | 'inventory' | 'expense';

export interface IJournalLine {
  accountId: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  partyId?: mongoose.Types.ObjectId;
  debit: mongoose.Types.Decimal128;
  credit: mongoose.Types.Decimal128;
  baseDebit: mongoose.Types.Decimal128;
  baseCredit: mongoose.Types.Decimal128;
  narration?: string;
}

export interface IJournalEntry extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  financialYearId: mongoose.Types.ObjectId;
  entryNumber: string;
  date: Date;
  bsDate: string;
  narration: string;
  status: JournalStatus;
  sourceModule: JournalSourceModule;
  sourceDocumentId?: mongoose.Types.ObjectId;
  sourceDocumentNumber?: string;
  currency: string;
  exchangeRate: mongoose.Types.Decimal128;
  lines: IJournalLine[];
  totalDebit: mongoose.Types.Decimal128;
  totalCredit: mongoose.Types.Decimal128;
  attachments: string[];
  approval?: {
    submittedBy?: mongoose.Types.ObjectId;
    submittedAt?: Date;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectedBy?: mongoose.Types.ObjectId;
    rejectedAt?: Date;
    rejectionReason?: string;
  };
  reversalOf?: mongoose.Types.ObjectId;
  reversedBy?: mongoose.Types.ObjectId;
  reversalReason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JournalLineSchema = new Schema<IJournalLine>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    accountCode: { type: String, required: true },
    accountName: { type: String, required: true },
    partyId: { type: Schema.Types.ObjectId, ref: 'Party', default: null },
    debit: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    credit: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    baseDebit: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    baseCredit: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    narration: { type: String, trim: true },
  },
  { _id: false }
);

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FiscalPeriod', required: true, index: true },
    entryNumber: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now, index: true },
    bsDate: { type: String, required: true },
    narration: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'posted', 'rejected', 'reversed', 'cancelled'],
      default: 'posted',
      index: true,
    },
    sourceModule: {
      type: String,
      enum: ['manual', 'sales', 'purchase', 'pos', 'payment', 'inventory', 'expense'],
      default: 'manual',
    },
    sourceDocumentId: { type: Schema.Types.ObjectId, default: null },
    sourceDocumentNumber: { type: String, trim: true },
    currency: { type: String, default: 'NPR' },
    exchangeRate: {
      type: Schema.Types.Decimal128,
      default: () => mongoose.Types.Decimal128.fromString('1.000000'),
    },
    lines: [JournalLineSchema],
    totalDebit: { type: Schema.Types.Decimal128, required: true },
    totalCredit: { type: Schema.Types.Decimal128, required: true },
    attachments: [{ type: String }],
    approval: {
      submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      submittedAt: { type: Date },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: { type: Date },
      rejectionReason: { type: String },
    },
    reversalOf: { type: Schema.Types.ObjectId, ref: 'JournalEntry', default: null },
    reversedBy: { type: Schema.Types.ObjectId, ref: 'JournalEntry', default: null },
    reversalReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

JournalEntrySchema.index({ organizationId: 1, entryNumber: 1 }, { unique: true });
JournalEntrySchema.index({ organizationId: 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, 'lines.accountId': 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, status: 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, sourceDocumentId: 1 });

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
