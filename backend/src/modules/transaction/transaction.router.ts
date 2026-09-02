import { Router } from 'express';
import { transactionController } from './transaction.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  createTransactionSchema,
  cancelTransactionSchema,
  recordPaymentSchema,
} from './transaction.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

// List transactions
router.get(
  '/transactions',
  authorize([PERMISSIONS.SALE_VIEW, PERMISSIONS.PURCHASE_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => transactionController.getTransactions(req, res, next)
);

// Get single transaction detail
router.get(
  '/transactions/:id',
  authorize([PERMISSIONS.SALE_VIEW, PERMISSIONS.PURCHASE_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => transactionController.getTransactionById(req, res, next)
);

// Create sales / purchase / POS / return
router.post(
  '/transactions',
  authorize([PERMISSIONS.SALE_CREATE, PERMISSIONS.PURCHASE_CREATE, PERMISSIONS.ALL]),
  validateRequest(createTransactionSchema),
  (req, res, next) => transactionController.createTransaction(req, res, next)
);

// Cancel / Reverse transaction
router.post(
  '/transactions/:id/cancel',
  authorize([PERMISSIONS.SALE_REVERSE, PERMISSIONS.ALL]),
  validateRequest(cancelTransactionSchema),
  (req, res, next) => transactionController.cancelTransaction(req, res, next)
);

// Record payment
router.post(
  '/transactions/:id/payment',
  authorize([PERMISSIONS.SALE_POST, PERMISSIONS.PURCHASE_POST, PERMISSIONS.ALL]),
  validateRequest(recordPaymentSchema),
  (req, res, next) => transactionController.recordPayment(req, res, next)
);

export const transactionRouter = router;
