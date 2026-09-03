import { Router } from 'express';
import { crmController } from '../controllers/crm.controller.js';
import { validateRequest } from '../../../middleware/validateRequest.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { tenantContext } from '../../../middleware/tenantContext.js';
import { authorize } from '../../../middleware/authorize.js';
import { PERMISSIONS } from '../../../constants/permissions.js';
import {
  leadSchema,
  opportunitySchema,
  quotationSchema,
  activitySchema,
  salesTargetSchema,
} from '../validation/crm.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

// 1. Duplicate Detection
router.get(
  '/crm/duplicates',
  authorize([PERMISSIONS.CRM_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => crmController.checkDuplicates(req, res, next)
);

// 2. Leads
router.get(
  '/crm/leads',
  authorize([PERMISSIONS.CRM_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => crmController.getLeads(req, res, next)
);

router.post(
  '/crm/leads',
  authorize([PERMISSIONS.CRM_CREATE, PERMISSIONS.ALL]),
  validateRequest(leadSchema),
  (req, res, next) => crmController.createLead(req, res, next)
);

router.post(
  '/crm/leads/:id/convert',
  authorize([PERMISSIONS.CRM_CREATE, PERMISSIONS.ALL]),
  (req, res, next) => crmController.convertLead(req, res, next)
);

// 3. Customer 360
router.get(
  '/crm/customers/:customerId/360',
  authorize([PERMISSIONS.CRM_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => crmController.getCustomer360(req, res, next)
);

// 4. Quotations
router.get(
  '/crm/quotations',
  authorize([PERMISSIONS.CRM_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => crmController.getQuotations(req, res, next)
);

router.post(
  '/crm/quotations',
  authorize([PERMISSIONS.CRM_CREATE, PERMISSIONS.ALL]),
  validateRequest(quotationSchema),
  (req, res, next) => crmController.createQuotation(req, res, next)
);

router.post(
  '/crm/quotations/:id/convert-to-order',
  authorize([PERMISSIONS.CRM_CREATE, PERMISSIONS.ALL]),
  (req, res, next) => crmController.convertQuotation(req, res, next)
);

// 5. Opportunities
router.get(
  '/crm/opportunities',
  authorize([PERMISSIONS.CRM_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => crmController.getOpportunities(req, res, next)
);

router.post(
  '/crm/opportunities',
  authorize([PERMISSIONS.CRM_CREATE, PERMISSIONS.ALL]),
  validateRequest(opportunitySchema),
  (req, res, next) => crmController.createOpportunity(req, res, next)
);

router.patch(
  '/crm/opportunities/:id/stage',
  authorize([PERMISSIONS.CRM_UPDATE, PERMISSIONS.ALL]),
  (req, res, next) => crmController.updateOpportunityStage(req, res, next)
);

// 6. Activities & Sales Targets
router.post(
  '/crm/activities',
  authorize([PERMISSIONS.CRM_CREATE, PERMISSIONS.ALL]),
  validateRequest(activitySchema),
  (req, res, next) => crmController.recordActivity(req, res, next)
);

router.get(
  '/crm/targets',
  authorize([PERMISSIONS.CRM_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => crmController.getSalesTargets(req, res, next)
);

router.post(
  '/crm/targets',
  authorize([PERMISSIONS.CRM_UPDATE, PERMISSIONS.ALL]),
  validateRequest(salesTargetSchema),
  (req, res, next) => crmController.createSalesTarget(req, res, next)
);

export const crmRouter = router;
