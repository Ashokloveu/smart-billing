import { Router } from 'express';
import { hrController } from './hr.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  employeeSchema,
  attendanceRecordSchema,
  leaveRequestSchema,
  payrollGenerateSchema,
} from './hr.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

// 1. Employee Master
router.get(
  '/hr/employees',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => hrController.getEmployees(req, res, next)
);

router.post(
  '/hr/employees',
  authorize([PERMISSIONS.ALL]),
  validateRequest(employeeSchema),
  (req, res, next) => hrController.createEmployee(req, res, next)
);

router.post(
  '/hr/employees/:id/lifecycle',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => hrController.updateLifecycle(req, res, next)
);

// 2. Attendance & Leaves
router.get(
  '/hr/attendance',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => hrController.getAttendance(req, res, next)
);

router.post(
  '/hr/attendance',
  authorize([PERMISSIONS.ALL]),
  validateRequest(attendanceRecordSchema),
  (req, res, next) => hrController.recordAttendance(req, res, next)
);

router.get(
  '/hr/leaves',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => hrController.getLeaves(req, res, next)
);

router.post(
  '/hr/leaves',
  authorize([PERMISSIONS.ALL]),
  validateRequest(leaveRequestSchema),
  (req, res, next) => hrController.createLeave(req, res, next)
);

router.post(
  '/hr/leaves/:id/approve',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => hrController.approveLeave(req, res, next)
);

// 3. Nepal Statutory Payroll Runs & Posting
router.get(
  '/hr/payroll',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => hrController.getPayrollRuns(req, res, next)
);

router.post(
  '/hr/payroll/generate',
  authorize([PERMISSIONS.ALL]),
  validateRequest(payrollGenerateSchema),
  (req, res, next) => hrController.generatePayroll(req, res, next)
);

router.post(
  '/hr/payroll/:id/post',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => hrController.postPayroll(req, res, next)
);

// 4. Executive BI Workforce Analytics
router.get(
  '/hr/bi/workforce',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => hrController.getWorkforceBi(req, res, next)
);

export const hrRouter = router;
