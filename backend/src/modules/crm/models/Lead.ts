import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadAttachment {
  fileName: string;
  fileUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  leadNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  panNumber?: string;
  source: 'website' | 'referral' | 'walk_in' | 'campaign' | 'social_media' | 'import';
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
  score: number;
  estimatedValue: mongoose.Types.Decimal128;
  assignedTo?: mongoose.Types.ObjectId;
  convertedPartyId?: mongoose.Types.ObjectId;
  convertedOpportunityId?: mongoose.Types.ObjectId;
  lostReason?: string;
  attachments: ILeadAttachment[];
  lastContactedAt?: Date;
  nextFollowUpDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadAttachmentSchema = new Schema<ILeadAttachment>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LeadSchema = new Schema<ILead>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    leadNumber: { type: String, required: true, trim: true, uppercase: true },
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    panNumber: { type: String, trim: true },
    source: {
      type: String,
      enum: ['website', 'referral', 'walk_in', 'campaign', 'social_media', 'import'],
      default: 'website',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'],
      default: 'new',
      index: true,
    },
    score: { type: Number, default: 50, min: 1, max: 100 },
    estimatedValue: {
      type: Schema.Types.Decimal128,
      default: () => mongoose.Types.Decimal128.fromString('0.00'),
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    convertedPartyId: { type: Schema.Types.ObjectId, ref: 'Party' },
    convertedOpportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
    lostReason: { type: String },
    attachments: [LeadAttachmentSchema],
    lastContactedAt: { type: Date },
    nextFollowUpDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

LeadSchema.index({ organizationId: 1, leadNumber: 1 }, { unique: true });
LeadSchema.index({ organizationId: 1, phone: 1 });
LeadSchema.index({ organizationId: 1, email: 1 });
LeadSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
