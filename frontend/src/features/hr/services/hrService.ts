import { apiClient } from '../../../services/apiClient';
import { Employee, AttendanceItem, LeaveRequest, PayrollRun, WorkforceBi } from '../types/hr';

export const hrService = {
  // Employees
  getEmployees: async (orgId: string, params?: any): Promise<Employee[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/hr/employees`, { params });
    return res.data.data;
  },

  createEmployee: async (orgId: string, payload: any): Promise<Employee> => {
    const res = await apiClient.post(`/organizations/${orgId}/hr/employees`, payload);
    return res.data.data;
  },

  updateLifecycle: async (orgId: string, id: string, payload: any): Promise<Employee> => {
    const res = await apiClient.post(`/organizations/${orgId}/hr/employees/${id}/lifecycle`, payload);
    return res.data.data;
  },

  // Attendance
  getAttendance: async (orgId: string, params?: any): Promise<AttendanceItem[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/hr/attendance`, { params });
    return res.data.data;
  },

  recordAttendance: async (orgId: string, payload: any): Promise<AttendanceItem> => {
    const res = await apiClient.post(`/organizations/${orgId}/hr/attendance`, payload);
    return res.data.data;
  },

  // Leaves
  getLeaves: async (orgId: string): Promise<LeaveRequest[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/hr/leaves`);
    return res.data.data;
  },

  createLeave: async (orgId: string, payload: any): Promise<LeaveRequest> => {
    const res = await apiClient.post(`/organizations/${orgId}/hr/leaves`, payload);
    return res.data.data;
  },

  approveLeave: async (orgId: string, id: string): Promise<LeaveRequest> => {
    const res = await apiClient.post(`/organizations/${orgId}/hr/leaves/${id}/approve`);
    return res.data.data;
  },

  // Payroll
  getPayrollRuns: async (orgId: string): Promise<PayrollRun[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/hr/payroll`);
    return res.data.data;
  },

  generatePayroll: async (orgId: string, payload: any): Promise<PayrollRun> => {
    const res = await apiClient.post(`/organizations/${orgId}/hr/payroll/generate`, payload);
    return res.data.data;
  },

  postPayroll: async (orgId: string, id: string): Promise<PayrollRun> => {
    const res = await apiClient.post(`/organizations/${orgId}/hr/payroll/${id}/post`);
    return res.data.data;
  },

  // BI
  getWorkforceBi: async (orgId: string): Promise<WorkforceBi> => {
    const res = await apiClient.get(`/organizations/${orgId}/hr/bi/workforce`);
    return res.data.data;
  },
};
