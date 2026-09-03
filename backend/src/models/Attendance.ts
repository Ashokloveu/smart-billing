import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  bsDate: string;
  checkIn?: Date;
  checkOut?: Date;
  workingHours: mongoose.Types.Decimal128;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeHours: mongoose.Types.Decimal128;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  source: 'manual' | 'biometric' | 'api';
  isLocked: boolean;
  correction?: {
    requestedCheckIn?: Date;
    requestedCheckOut?: Date;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: Date, required: true, index: true },
    bsDate: { type: String, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    workingHours: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    lateMinutes: { type: Number, default: 0 },
    earlyExitMinutes: { type: Number, default: 0 },
    overtimeHours: { type: Schema.Types.Decimal128, default: () => mongoose.Types.Decimal128.fromString('0.00') },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'leave', 'holiday'],
      default: 'present',
      index: true,
    },
    source: { type: String, enum: ['manual', 'biometric', 'api'], default: 'manual' },
    isLocked: { type: Boolean, default: false, index: true },
    correction: {
      requestedCheckIn: { type: Date },
      requestedCheckOut: { type: Date },
      reason: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'] },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ organizationId: 1, employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
