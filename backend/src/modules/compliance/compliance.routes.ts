import { Router } from 'express';
import { complianceController } from './compliance.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  vatRegisterQuerySchema,
  documentSequenceConfigSchema,
  closeFiscalPeriodSchema,
} from './compliance.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

// 1. Nepal VAT Registers
router.get(
  '/compliance/sales-register',
  authorize([PERMISSIONS.REPORT_VAT_VIEW, PERMISSIONS.ALL]),
  validateRequest(vatRegisterQuerySchema),
  (req, res, next) => complianceController.getSalesRegister(req, res, next)
);

router.get(
  '/compliance/purchase-register',
  authorize([PERMISSIONS.REPORT_VAT_VIEW, PERMISSIONS.ALL]),
  validateRequest(vatRegisterQuerySchema),
  (req, res, next) => complianceController.getPurchaseRegister(req, res, next)
);

// 2. Invoice Compliance Check
router.get(
  '/compliance/verify-invoice/:id',
  authorize([PERMISSIONS.SALE_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => complianceController.verifyInvoice(req, res, next)
);

// 3. Document Numbering Sequence Configuration
router.get(
  '/compliance/sequences',
  authorize([PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ALL]),
  (req, res, next) => complianceController.getSequences(req, res, next)
);

router.post(
  '/compliance/sequences',
  authorize([PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ALL]),
  validateRequest(documentSequenceConfigSchema),
  (req, res, next) => complianceController.upsertSequence(req, res, next)
);

// 4. Fiscal Year Closing & Period Locking
router.post(
  '/compliance/fiscal-periods/:id/close',
  authorize([PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ALL]),
  validateRequest(closeFiscalPeriodSchema),
  (req, res, next) => complianceController.closeFiscalPeriod(req, res, next)
);

// 5. Financial Audit Logs
router.get(
  '/compliance/audit-logs',
  authorize([PERMISSIONS.AUDIT_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => complianceController.getAuditLogs(req, res, next)
);

export const complianceRouter = router;
