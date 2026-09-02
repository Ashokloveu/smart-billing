import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyUser extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  assignedFirmIds: mongoose.Types.ObjectId[];
  status: 'invited' | 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const CompanyUserSchema = new Schema<ICompanyUser>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    assignedFirmIds: [{ type: Schema.Types.ObjectId, ref: 'Firm' }],
    status: { type: String, enum: ['invited', 'active', 'suspended'], default: 'active' },
  },
  {
    timestamps: true,
  }
);

CompanyUserSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const CompanyUser = mongoose.model<ICompanyUser>('CompanyUser', CompanyUserSchema);
