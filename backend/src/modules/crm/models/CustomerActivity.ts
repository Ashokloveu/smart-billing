import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerActivity extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  type: 'call' | 'email' | 'meeting' | 'note' | 'follow_up';
  title: string;
  description: string;
  followUpDate?: Date;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerActivitySchema = new Schema<ICustomerActivity>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Party', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'follow_up'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    followUpDate: { type: Date },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

CustomerActivitySchema.index({ organizationId: 1, customerId: 1, timestamp: -1 });

export const CustomerActivity = mongoose.model<ICustomerActivity>('CustomerActivity', CustomerActivitySchema);
