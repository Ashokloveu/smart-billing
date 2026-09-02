import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { reportFilterSchema } from './reports.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

// 1. Dashboard Summary
router.get(
  '/reports/dashboard-summary',
  authorize([PERMISSIONS.REPORT_PNL_VIEW, PERMISSIONS.REPORT_STOCK_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => reportsController.getDashboardSummary(req, res, next)
);

// 2. Sales Summary
router.get(
  '/reports/sales-summary',
  authorize([PERMISSIONS.SALE_VIEW, PERMISSIONS.ALL]),
  validateRequest(reportFilterSchema),
  (req, res, next) => reportsController.getSalesSummary(req, res, next)
);

// 3. Purchase Summary
router.get(
  '/reports/purchase-summary',
  authorize([PERMISSIONS.PURCHASE_VIEW, PERMISSIONS.ALL]),
  validateRequest(reportFilterSchema),
  (req, res, next) => reportsController.getPurchaseSummary(req, res, next)
);

// 4. Inventory Summary
router.get(
  '/reports/inventory-summary',
  authorize([PERMISSIONS.REPORT_STOCK_VIEW, PERMISSIONS.ALL]),
  validateRequest(reportFilterSchema),
  (req, res, next) => reportsController.getInventorySummary(req, res, next)
);

// 5. Profit & Loss
router.get(
  '/reports/profit-loss',
  authorize([PERMISSIONS.REPORT_PNL_VIEW, PERMISSIONS.ALL]),
  validateRequest(reportFilterSchema),
  (req, res, next) => reportsController.getProfitLoss(req, res, next)
);

// 6. Top Selling Items
router.get(
  '/reports/top-selling-items',
  authorize([PERMISSIONS.SALE_VIEW, PERMISSIONS.ALL]),
  validateRequest(reportFilterSchema),
  (req, res, next) => reportsController.getTopSellingItems(req, res, next)
);

// 7. Outstanding Summary
router.get(
  '/reports/outstanding-summary',
  authorize([PERMISSIONS.PARTY_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => reportsController.getOutstandingSummary(req, res, next)
);

export const reportsRouter = router;
