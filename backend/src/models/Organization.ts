import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  logoUrl?: string;
  taxRegistration: {
    type: 'PAN' | 'VAT';
    number: string;
    verified: boolean;
  };
  subscription: {
    plan: 'starter' | 'standard' | 'enterprise';
    expiresAt: Date;
  };
  settings: {
    defaultCurrency: string;
    decimalPrecision: number;
    roundOffMethod: 'nearest' | 'up' | 'down' | 'none';
    allowNegativeStock: boolean;
    displayCalendar: 'bikram_sambat' | 'gregorian' | 'both';
    primaryLanguage: 'en' | 'ne' | 'bilingual';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    country: { type: String, required: true, default: 'NP' },
    currency: { type: String, required: true, default: 'NPR' },
    timezone: { type: String, required: true, default: 'Asia/Kathmandu' },
    logoUrl: { type: String },
    taxRegistration: {
      type: { type: String, enum: ['PAN', 'VAT'], required: true, default: 'PAN' },
      number: { type: String, required: true, match: /^[0-9]{9}$/ },
      verified: { type: Boolean, default: false },
    },
    subscription: {
      plan: { type: String, enum: ['starter', 'standard', 'enterprise'], default: 'standard' },
      expiresAt: {
        type: Date,
        default: () => {
          const d = new Date();
          d.setFullYear(d.getFullYear() + 1);
          return d;
        },
      },
    },
    settings: {
      defaultCurrency: { type: String, default: 'NPR' },
      decimalPrecision: { type: Number, default: 2 },
      roundOffMethod: { type: String, enum: ['nearest', 'up', 'down', 'none'], default: 'nearest' },
      allowNegativeStock: { type: Boolean, default: false },
      displayCalendar: { type: String, enum: ['bikram_sambat', 'gregorian', 'both'], default: 'both' },
      primaryLanguage: { type: String, enum: ['en', 'ne', 'bilingual'], default: 'bilingual' },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ 'taxRegistration.number': 1 }, { sparse: true });
OrganizationSchema.index({ isActive: 1, createdAt: -1 });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
