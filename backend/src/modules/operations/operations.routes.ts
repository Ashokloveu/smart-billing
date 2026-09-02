import { Router } from 'express';
import { operationsController } from './operations.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  stockTransferSchema,
  stockBatchSchema,
  purchaseRequisitionSchema,
  purchaseOrderSchema,
  goodsReceiptSchema,
  salesOrderSchema,
  stockAdjustmentSchema,
} from './operations.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

// 1. Stock Transfers
router.get(
  '/operations/transfers',
  authorize([PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => operationsController.getTransfers(req, res, next)
);

router.post(
  '/operations/transfers',
  authorize([PERMISSIONS.INVENTORY_TRANSFER, PERMISSIONS.ALL]),
  validateRequest(stockTransferSchema),
  (req, res, next) => operationsController.createTransfer(req, res, next)
);

router.post(
  '/operations/transfers/:id/dispatch',
  authorize([PERMISSIONS.INVENTORY_TRANSFER, PERMISSIONS.ALL]),
  (req, res, next) => operationsController.dispatchTransfer(req, res, next)
);

router.post(
  '/operations/transfers/:id/receive',
  authorize([PERMISSIONS.INVENTORY_TRANSFER, PERMISSIONS.ALL]),
  (req, res, next) => operationsController.receiveTransfer(req, res, next)
);

// 2. Stock Batches
router.get(
  '/operations/batches',
  authorize([PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => operationsController.getBatches(req, res, next)
);

router.post(
  '/operations/batches',
  authorize([PERMISSIONS.INVENTORY_ADJUST, PERMISSIONS.ALL]),
  validateRequest(stockBatchSchema),
  (req, res, next) => operationsController.createBatch(req, res, next)
);

// 3. Purchase Requisitions
router.get(
  '/operations/requisitions',
  authorize([PERMISSIONS.PURCHASE_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => operationsController.getRequisitions(req, res, next)
);

router.post(
  '/operations/requisitions',
  authorize([PERMISSIONS.PURCHASE_CREATE, PERMISSIONS.ALL]),
  validateRequest(purchaseRequisitionSchema),
  (req, res, next) => operationsController.createRequisition(req, res, next)
);

// 4. Purchase Orders
router.get(
  '/operations/purchase-orders',
  authorize([PERMISSIONS.PURCHASE_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => operationsController.getPurchaseOrders(req, res, next)
);

router.post(
  '/operations/purchase-orders',
  authorize([PERMISSIONS.PURCHASE_CREATE, PERMISSIONS.ALL]),
  validateRequest(purchaseOrderSchema),
  (req, res, next) => operationsController.createPurchaseOrder(req, res, next)
);

// 5. Goods Receipts (GRN)
router.get(
  '/operations/goods-receipts',
  authorize([PERMISSIONS.PURCHASE_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => operationsController.getGoodsReceipts(req, res, next)
);

router.post(
  '/operations/goods-receipts',
  authorize([PERMISSIONS.PURCHASE_CREATE, PERMISSIONS.ALL]),
  validateRequest(goodsReceiptSchema),
  (req, res, next) => operationsController.createGoodsReceipt(req, res, next)
);

// 6. Sales Orders
router.get(
  '/operations/sales-orders',
  authorize([PERMISSIONS.SALE_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => operationsController.getSalesOrders(req, res, next)
);

router.post(
  '/operations/sales-orders',
  authorize([PERMISSIONS.SALE_CREATE, PERMISSIONS.ALL]),
  validateRequest(salesOrderSchema),
  (req, res, next) => operationsController.createSalesOrder(req, res, next)
);

// 7. Stock Adjustments with GL Hook
router.post(
  '/operations/adjustments',
  authorize([PERMISSIONS.INVENTORY_ADJUST, PERMISSIONS.ALL]),
  validateRequest(stockAdjustmentSchema),
  (req, res, next) => operationsController.adjustStock(req, res, next)
);

// 8. Universal Approvals
router.post(
  '/operations/approvals/:docType/:id',
  authorize([PERMISSIONS.ALL]),
  (req, res, next) => operationsController.approveDocument(req, res, next)
);

export const operationsRouter = router;
