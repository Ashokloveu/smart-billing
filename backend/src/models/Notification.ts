import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  role?: string;
  type: 'approval_request' | 'low_stock' | 'payment_due' | 'credit_breach' | 'system';
  title: string;
  message: string;
  referenceUrl?: string;
  referenceDocument?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String },
    type: {
      type: String,
      enum: ['approval_request', 'low_stock', 'payment_due', 'credit_breach', 'system'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceUrl: { type: String },
    referenceDocument: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ organizationId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
