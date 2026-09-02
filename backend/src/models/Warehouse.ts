import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouse extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  address?: {
    line1?: string;
    city?: string;
    district?: string;
    province?: string;
  };
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: 'Kathmandu' },
      district: { type: String, default: 'Kathmandu' },
      province: { type: String, default: 'Bagmati' },
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

WarehouseSchema.index({ organizationId: 1, code: 1 }, { unique: true });
WarehouseSchema.index({ organizationId: 1, firmId: 1 });
WarehouseSchema.index({ organizationId: 1, isDefault: 1 });

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
