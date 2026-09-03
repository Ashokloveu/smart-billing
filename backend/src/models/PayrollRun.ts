import mongoose, { Schema, Document } from 'mongoose';

export interface IPayslipItem {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  panNumber?: string;
  ssfNumber?: string;
  maritalStatus: 'single' | 'married';
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  basicSalary: mongoose.Types.Decimal128;
  allowancesTotal: mongoose.Types.Decimal128;
  grossSalary: mongoose.Types.Decimal128;
  employeeSsf: mongoose.Types.Decimal128; // 11%
  employerSsf: mongoose.Types.Decimal128; // 20%
  taxableIncome: mongoose.Types.Decimal128;
  taxTds: mongoose.Types.Decimal128; // Nepal TDS
  otherDeductions: mongoose.Types.Decimal128;
  totalDeductions: mongoose.Types.Decimal128;
  netPayable: mongoose.Types.Decimal128;
  paymentStatus: 'unpaid' | 'paid';
}

export interface IPayrollRun extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  financialYearId: mongoose.Types.ObjectId;
  payrollNumber: string;
  month: string;
  fiscalYear: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'posted' | 'settled' | 'reversed';
  payslips: IPayslipItem[];
  totalGross: mongoose.Types.Decimal128;
  totalEmployerSsf: mongoose.Types.Decimal128;
  totalEmployeeSsf: mongoose.Types.Decimal128;
  totalTaxTds: mongoose.Types.Decimal128;
  totalOtherDeductions: mongoose.Types.Decimal128;
  totalNetSalary: mongoose.Types.Decimal128;
  journalEntryId?: mongoose.Types.ObjectId;
  settlementEntryId?: mongoose.Types.ObjectId;
  processedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  reversalReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayslipItemSchema = new Schema<IPayslipItem>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, required: true },
    panNumber: { type: String },
    ssfNumber: { type: String },
    maritalStatus: { type: String, enum: ['single', 'married'], default: 'single' },
    workingDays: { type: Number, default: 30 },
    presentDays: { type: Number, default: 30 },
    paidLeaveDays: { type: Number, default: 0 },
    basicSalary: { type: Schema.Types.Decimal128, required: true },
    allowancesTotal: { type: Schema.Types.Decimal128, required: true },
    grossSalary: { type: Schema.Types.Decimal128, required: true },
    employeeSsf: { type: Schema.Types.Decimal128, required: true },
    employerSsf: { type: Schema.Types.Decimal128, required: true },
    taxableIncome: { type: Schema.Types.Decimal128, required: true },
    taxTds: { type: Schema.Types.Decimal128, required: true },
    otherDeductions: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    totalDeductions: { type: Schema.Types.Decimal128, required: true },
    netPayable: { type: Schema.Types.Decimal128, required: true },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  },
  { _id: false }
);

const PayrollRunSchema = new Schema<IPayrollRun>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    financialYearId: { type: Schema.Types.ObjectId, ref: 'FiscalPeriod', required: true, index: true },
    payrollNumber: { type: String, required: true, trim: true },
    month: { type: String, required: true, trim: true },
    fiscalYear: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'posted', 'settled', 'reversed'],
      default: 'draft',
      index: true,
    },
    payslips: [PayslipItemSchema],
    totalGross: { type: Schema.Types.Decimal128, required: true },
    totalEmployerSsf: { type: Schema.Types.Decimal128, required: true },
    totalEmployeeSsf: { type: Schema.Types.Decimal128, required: true },
    totalTaxTds: { type: Schema.Types.Decimal128, required: true },
    totalOtherDeductions: { type: Schema.Types.Decimal128, required: true },
    totalNetSalary: { type: Schema.Types.Decimal128, required: true },
    journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    settlementEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reversalReason: { type: String },
  },
  {
    timestamps: true,
  }
);

PayrollRunSchema.index({ organizationId: 1, payrollNumber: 1 }, { unique: true });
PayrollRunSchema.index({ organizationId: 1, month: 1, fiscalYear: 1 });

export const PayrollRun = mongoose.model<IPayrollRun>('PayrollRun', PayrollRunSchema);
