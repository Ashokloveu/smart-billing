import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentSequence extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  financialYearId: mongoose.Types.ObjectId;
  type: string;
  prefix: string;
  nextNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSequenceSchema = new Schema<IDocumentSequence>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FiscalPeriod', required: true, index: true },
    type: { type: String, required: true },
    prefix: { type: String, required: true },
    nextNumber: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

DocumentSequenceSchema.index(
  { organizationId: 1, firmId: 1, financialYearId: 1, type: 1 },
  { unique: true }
);

export const DocumentSequence = mongoose.model<IDocumentSequence>(
  'DocumentSequence',
  DocumentSequenceSchema
);
