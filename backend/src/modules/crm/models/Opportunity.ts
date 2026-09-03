import mongoose, { Schema, Document } from 'mongoose';

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  opportunityNumber: string;
  title: string;
  customerId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  stage:
    | 'prospecting'
    | 'qualification'
    | 'needs_analysis'
    | 'value_proposition'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';
  expectedRevenue: mongoose.Types.Decimal128;
  probability: number;
  weightedRevenue: mongoose.Types.Decimal128;
  expectedCloseDate: Date;
  salesOwner: mongoose.Types.ObjectId;
  lostReason?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    opportunityNumber: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    stage: {
      type: String,
      enum: [
        'prospecting',
        'qualification',
        'needs_analysis',
        'value_proposition',
        'proposal',
        'negotiation',
        'closed_won',
        'closed_lost',
      ],
      default: 'prospecting',
      index: true,
    },
    expectedRevenue: { type: Schema.Types.Decimal128, required: true },
    probability: { type: Number, default: 20, min: 0, max: 100 },
    weightedRevenue: { type: Schema.Types.Decimal128, required: true },
    expectedCloseDate: { type: Date, required: true },
    salesOwner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lostReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

OpportunitySchema.index({ organizationId: 1, opportunityNumber: 1 }, { unique: true });
OpportunitySchema.index({ organizationId: 1, stage: 1, createdAt: -1 });

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
