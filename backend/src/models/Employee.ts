import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeDocument {
  documentType: 'citizenship' | 'pan_card' | 'contract' | 'academic' | 'other';
  documentNumber?: string;
  fileUrl: string;
  expiryDate?: Date;
}

export interface IStatusChange {
  fromStatus: string;
  toStatus: string;
  effectiveDate: Date;
  remarks?: string;
  changedBy: mongoose.Types.ObjectId;
}

export interface IEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  maritalStatus: 'single' | 'married';
  panNumber?: string;
  ssfNumber?: string;
  citNumber?: string;
  department: string;
  designation: string;
  branchId?: mongoose.Types.ObjectId;
  joiningDate: Date;
  confirmationDate?: Date;
  lifecycleStatus: 'onboarding' | 'probation' | 'confirmed' | 'transferred' | 'resigned' | 'terminated';
  statusChangeHistory: IStatusChange[];
  documents: IEmployeeDocument[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    branchName?: string;
  };
  salaryStructure: {
    basicSalary: mongoose.Types.Decimal128;
    allowances: Array<{ name: string; amount: mongoose.Types.Decimal128; isTaxable: boolean }>;
    deductions: Array<{ name: string; amount: mongoose.Types.Decimal128 }>;
  };
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeDocumentSchema = new Schema<IEmployeeDocument>(
  {
    documentType: {
      type: String,
      enum: ['citizenship', 'pan_card', 'contract', 'academic', 'other'],
      required: true,
    },
    documentNumber: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    expiryDate: { type: Date },
  },
  { _id: false }
);

const StatusChangeSchema = new Schema<IStatusChange>(
  {
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    effectiveDate: { type: Date, default: Date.now },
    remarks: { type: String },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const EmployeeSchema = new Schema<IEmployee>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    employeeCode: { type: String, required: true, trim: true, uppercase: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    maritalStatus: { type: String, enum: ['single', 'married'], default: 'single' },
    panNumber: { type: String, trim: true },
    ssfNumber: { type: String, trim: true },
    citNumber: { type: String, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    designation: { type: String, required: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    joiningDate: { type: Date, required: true },
    confirmationDate: { type: Date },
    lifecycleStatus: {
      type: String,
      enum: ['onboarding', 'probation', 'confirmed', 'transferred', 'resigned', 'terminated'],
      default: 'onboarding',
      index: true,
    },
    statusChangeHistory: [StatusChangeSchema],
    documents: [EmployeeDocumentSchema],
    bankDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
      branchName: { type: String, trim: true },
    },
    salaryStructure: {
      basicSalary: { type: Schema.Types.Decimal128, required: true, default: () => mongoose.Types.Decimal128.fromString('0.00') },
      allowances: [
        {
          name: { type: String, required: true },
          amount: { type: Schema.Types.Decimal128, required: true },
          isTaxable: { type: Boolean, default: true },
        },
      ],
      deductions: [
        {
          name: { type: String, required: true },
          amount: { type: Schema.Types.Decimal128, required: true },
        },
      ],
    },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

EmployeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
EmployeeSchema.index({ organizationId: 1, email: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
