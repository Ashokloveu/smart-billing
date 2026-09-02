import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  createWarehouseSchema,
  openingStockSchema,
  stockAdjustmentSchema,
  stockTransferSchema,
} from './inventory.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

// Warehouses
router.get('/warehouses', (req, res, next) => inventoryController.getWarehouses(req, res, next));
router.post(
  '/warehouses',
  authorize([PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ALL]),
  validateRequest(createWarehouseSchema),
  (req, res, next) => inventoryController.createWarehouse(req, res, next)
);

// Opening Stock
router.post(
  '/inventory/opening-stock',
  authorize([PERMISSIONS.INVENTORY_ADJUST, PERMISSIONS.ALL]),
  validateRequest(openingStockSchema),
  (req, res, next) => inventoryController.recordOpeningStock(req, res, next)
);

// Stock Adjustment
router.post(
  '/inventory/adjustments',
  authorize([PERMISSIONS.INVENTORY_ADJUST, PERMISSIONS.ALL]),
  validateRequest(stockAdjustmentSchema),
  (req, res, next) => inventoryController.recordStockAdjustment(req, res, next)
);

// Inter-Warehouse Transfer
router.post(
  '/inventory/transfers',
  authorize([PERMISSIONS.INVENTORY_TRANSFER, PERMISSIONS.ALL]),
  validateRequest(stockTransferSchema),
  (req, res, next) => inventoryController.transferStock(req, res, next)
);

// Live Positions & Balances
router.get(
  '/inventory/balances',
  authorize([PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => inventoryController.getInventoryPositions(req, res, next)
);

// Item Movement Subledger
router.get(
  '/inventory/ledger/:itemId',
  authorize([PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => inventoryController.getItemStockLedger(req, res, next)
);

// Reports
router.get(
  '/inventory/reports/valuation',
  authorize([PERMISSIONS.REPORT_STOCK_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => inventoryController.getValuationReport(req, res, next)
);

router.get(
  '/inventory/reports/low-stock',
  authorize([PERMISSIONS.REPORT_STOCK_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => inventoryController.getLowStockReport(req, res, next)
);

export const inventoryRouter = router;
