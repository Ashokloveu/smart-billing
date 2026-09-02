import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  mfa: {
    enabled: boolean;
    secret?: string;
  };
  isSuperAdmin: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String },
    },
    isSuperAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
