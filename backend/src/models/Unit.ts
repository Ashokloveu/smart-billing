import mongoose, { Schema, Document } from 'mongoose';

export interface IUnit extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  abbreviation: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    abbreviation: { type: String, required: true, trim: true, uppercase: true },
    isSystem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

UnitSchema.index({ organizationId: 1, abbreviation: 1 }, { unique: true });

export const Unit = mongoose.model<IUnit>('Unit', UnitSchema);
