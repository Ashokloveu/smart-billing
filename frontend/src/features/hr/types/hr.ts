import { DecimalOrString } from '../../../utils/decimal';

export interface Employee {
  _id: string;
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
  joiningDate: string;
  lifecycleStatus: 'onboarding' | 'probation' | 'confirmed' | 'transferred' | 'resigned' | 'terminated';
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  salaryStructure: {
    basicSalary: DecimalOrString;
    allowances: Array<{ name: string; amount: DecimalOrString; isTaxable: boolean }>;
    deductions: Array<{ name: string; amount: DecimalOrString }>;
  };
  isActive: boolean;
}

export interface AttendanceItem {
  _id: string;
  employeeId: { _id: string; firstName: string; lastName: string; employeeCode: string; department: string };
  date: string;
  bsDate: string;
  checkIn?: string;
  checkOut?: string;
  workingHours: DecimalOrString;
  lateMinutes: number;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  isLocked: boolean;
}

export interface LeaveRequest {
  _id: string;
  employeeId: { _id: string; firstName: string; lastName: string; employeeCode: string; department: string };
  leaveType: 'casual' | 'sick' | 'annual' | 'unpaid';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
}

export interface PayrollRun {
  _id: string;
  payrollNumber: string;
  month: string;
  fiscalYear: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'posted' | 'settled' | 'reversed';
  payslips: Array<{
    employeeId: string;
    employeeName: string;
    panNumber?: string;
    ssfNumber?: string;
    basicSalary: DecimalOrString;
    allowancesTotal: DecimalOrString;
    grossSalary: DecimalOrString;
    employeeSsf: DecimalOrString;
    employerSsf: DecimalOrString;
    taxTds: DecimalOrString;
    totalDeductions: DecimalOrString;
    netPayable: DecimalOrString;
  }>;
  totalGross: DecimalOrString;
  totalEmployerSsf: DecimalOrString;
  totalEmployeeSsf: DecimalOrString;
  totalTaxTds: DecimalOrString;
  totalNetSalary: DecimalOrString;
}

export interface WorkforceBi {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  turnoverRate: string;
  attendanceRate: string;
  departmentStats: Array<{ _id: string; count: number }>;
  payrollTrend: Array<{
    month: string;
    gross: number;
    net: number;
    ssf: number;
    tds: number;
  }>;
}
