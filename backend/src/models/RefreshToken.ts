import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  family: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    family: { type: String, required: true, index: true },
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, expires: 0 }, // MongoDB TTL Index
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
