import mongoose, { Schema, Document } from 'mongoose';

export interface IQuotationItem {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  quantity: mongoose.Types.Decimal128;
  rate: mongoose.Types.Decimal128;
  discountAmount: mongoose.Types.Decimal128;
  taxableAmount: mongoose.Types.Decimal128;
  taxRate: mongoose.Types.Decimal128;
  taxAmount: mongoose.Types.Decimal128;
  totalAmount: mongoose.Types.Decimal128;
}

export interface IQuotation extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  financialYearId: mongoose.Types.ObjectId;
  quotationNumber: string;
  version: number;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPan?: string;
  opportunityId?: mongoose.Types.ObjectId;
  quotationDate: Date;
  validUntil: Date;
  status: 'draft' | 'submitted' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'converted';
  items: IQuotationItem[];
  subtotal: mongoose.Types.Decimal128;
  taxTotal: mongoose.Types.Decimal128;
  grandTotal: mongoose.Types.Decimal128;
  termsAndConditions?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  convertedSalesOrderId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    quantity: { type: Schema.Types.Decimal128, required: true },
    rate: { type: Schema.Types.Decimal128, required: true },
    discountAmount: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    taxableAmount: { type: Schema.Types.Decimal128, required: true },
    taxRate: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('13.00') },
    taxAmount: { type: Schema.Types.Decimal128, required: true },
    totalAmount: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const QuotationSchema = new Schema<IQuotation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FiscalPeriod', required: true, index: true },
    quotationNumber: { type: String, required: true, trim: true, uppercase: true },
    version: { type: Number, default: 1 },
    customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    customerName: { type: String, required: true },
    customerPan: { type: String },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
    quotationDate: { type: Date, default: Date.now, index: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'sent', 'accepted', 'rejected', 'converted'],
      default: 'draft',
      index: true,
    },
    items: [QuotationItemSchema],
    subtotal: { type: Schema.Types.Decimal128, required: true },
    taxTotal: { type: Schema.Types.Decimal128, required: true },
    grandTotal: { type: Schema.Types.Decimal128, required: true },
    termsAndConditions: { type: String },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    convertedSalesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

QuotationSchema.index({ organizationId: 1, quotationNumber: 1, version: 1 }, { unique: true });

export const Quotation = mongoose.model<IQuotation>('Quotation', QuotationSchema);
