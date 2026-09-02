import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  name: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
    name: { type: String, required: true, trim: true },
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String, required: true }],
  },
  {
    timestamps: true,
  }
);

RoleSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const Role = mongoose.model<IRole>('Role', RoleSchema);
