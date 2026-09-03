export interface EmployeeDTO {
  firmId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  maritalStatus?: 'single' | 'married';
  panNumber?: string;
  ssfNumber?: string;
  citNumber?: string;
  department: string;
  designation: string;
  branchId?: string;
  joiningDate: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  basicSalary: string | number;
  allowances?: Array<{ name: string; amount: string | number; isTaxable?: boolean }>;
  deductions?: Array<{ name: string; amount: string | number }>;
}

export interface AttendanceRecordDTO {
  employeeId: string;
  date: string;
  bsDate: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
}

export interface LeaveRequestDTO {
  employeeId: string;
  leaveType: 'casual' | 'sick' | 'annual' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
}

export interface PayrollGenerateDTO {
  firmId: string;
  financialYearId: string;
  month: string;
  fiscalYear: string;
  startDate: string;
  endDate: string;
}
