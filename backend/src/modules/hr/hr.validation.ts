import { z } from 'zod';

export const employeeSchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID required'),
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(7, 'Valid phone required'),
    maritalStatus: z.enum(['single', 'married']).optional(),
    panNumber: z.string().optional(),
    ssfNumber: z.string().optional(),
    citNumber: z.string().optional(),
    department: z.string().min(1, 'Department required'),
    designation: z.string().min(1, 'Designation required'),
    branchId: z.string().optional(),
    joiningDate: z.string().min(1, 'Joining date required'),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolderName: z.string().optional(),
    basicSalary: z.union([z.string(), z.number()]),
    allowances: z.array(
      z.object({
        name: z.string().min(1),
        amount: z.union([z.string(), z.number()]),
        isTaxable: z.boolean().optional(),
      })
    ).optional(),
    deductions: z.array(
      z.object({
        name: z.string().min(1),
        amount: z.union([z.string(), z.number()]),
      })
    ).optional(),
  }),
});

export const attendanceRecordSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee ID required'),
    date: z.string().min(1, 'Date required'),
    bsDate: z.string().min(1, 'Nepali date required'),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.enum(['present', 'absent', 'half_day', 'leave', 'holiday']),
  }),
});

export const leaveRequestSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee ID required'),
    leaveType: z.enum(['casual', 'sick', 'annual', 'unpaid']),
    startDate: z.string().min(1, 'Start date required'),
    endDate: z.string().min(1, 'End date required'),
    reason: z.string().min(1, 'Reason required'),
  }),
});

export const payrollGenerateSchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID required'),
    financialYearId: z.string().min(1, 'Fiscal Year ID required'),
    month: z.string().min(1, 'Month name required'),
    fiscalYear: z.string().min(1, 'Fiscal Year required'),
    startDate: z.string().min(1, 'Start date required'),
    endDate: z.string().min(1, 'End date required'),
  }),
});
