import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  parentCategoryId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    parentCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ organizationId: 1, name: 1, parentCategoryId: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
