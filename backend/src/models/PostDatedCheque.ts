import mongoose, { Document, Schema } from 'mongoose';

export type ChequeStatus = 'pending' | 'deposited' | 'cleared' | 'bounced' | 'cancelled';

export interface IPostDatedCheque extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  chequeNumber: string;
  amount: mongoose.Types.Decimal128;
  chequeDate: Date;
  partyName: string;
  bankName: string;
  type: 'receive' | 'issue';
  status: ChequeStatus;
  remarks?: string;
  statusHistory: Array<{ status: ChequeStatus; changedAt: Date; changedBy: mongoose.Types.ObjectId }>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostDatedChequeSchema = new Schema<IPostDatedCheque>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  chequeNumber: { type: String, required: true, trim: true, uppercase: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  chequeDate: { type: Date, required: true, index: true },
  partyName: { type: String, required: true, trim: true, maxlength: 150 },
  bankName: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: ['receive', 'issue'], required: true },
  status: { type: String, enum: ['pending', 'deposited', 'cleared', 'bounced', 'cancelled'], default: 'pending', index: true },
  remarks: { type: String, trim: true, maxlength: 500 },
  statusHistory: [{
    _id: false,
    status: { type: String, enum: ['pending', 'deposited', 'cleared', 'bounced', 'cancelled'], required: true },
    changedAt: { type: Date, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

PostDatedChequeSchema.index({ organizationId: 1, chequeNumber: 1, bankName: 1 }, { unique: true });

export const PostDatedCheque = mongoose.model<IPostDatedCheque>('PostDatedCheque', PostDatedChequeSchema);
