import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  type: 'product' | 'service';
  name: string;
  code: string;
  barcode?: string;
  categoryId: mongoose.Types.ObjectId;
  primaryUnitId: mongoose.Types.ObjectId;
  secondaryUnitId?: mongoose.Types.ObjectId;
  conversionFactor?: mongoose.Types.Decimal128;
  hsnSacCode?: string;
  taxPolicyId: mongoose.Types.ObjectId;
  salePrice: mongoose.Types.Decimal128;
  purchasePrice: mongoose.Types.Decimal128;
  isStockTracked: boolean;
  minimumStock?: mongoose.Types.Decimal128;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, enum: ['product', 'service'], required: true, default: 'product' },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    primaryUnitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    secondaryUnitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    conversionFactor: { type: Schema.Types.Decimal128 },
    hsnSacCode: { type: String, trim: true },
    taxPolicyId: { type: Schema.Types.ObjectId, ref: 'TaxPolicy', required: true },
    salePrice: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    purchasePrice: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    isStockTracked: { type: Boolean, default: true },
    minimumStock: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

ItemSchema.index({ organizationId: 1, code: 1 }, { unique: true });
ItemSchema.index({ organizationId: 1, barcode: 1 }, { sparse: true, unique: true });
ItemSchema.index({ organizationId: 1, categoryId: 1 });
ItemSchema.index({ organizationId: 1, name: 'text' });

export const Item = mongoose.model<IItem>('Item', ItemSchema);
