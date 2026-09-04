import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { treasuryController } from './treasury.controller.js';
import {
  createChequeSchema,
  createFundTransferSchema,
  createTreasuryAccountSchema,
  setReconciliationSchema,
  updateChequeStatusSchema,
} from './treasury.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

router.get('/treasury/accounts', authorize([PERMISSIONS.TREASURY_VIEW, PERMISSIONS.ACCOUNTING_VIEW, PERMISSIONS.ALL]), (req, res, next) => treasuryController.getAccounts(req, res, next));
router.post('/treasury/accounts', authorize([PERMISSIONS.TREASURY_MANAGE, PERMISSIONS.ALL]), validateRequest(createTreasuryAccountSchema), (req, res, next) => treasuryController.createAccount(req, res, next));
router.get('/treasury/transfers', authorize([PERMISSIONS.TREASURY_VIEW, PERMISSIONS.ACCOUNTING_VIEW, PERMISSIONS.ALL]), (req, res, next) => treasuryController.getTransfers(req, res, next));
router.post('/treasury/transfers', authorize([PERMISSIONS.TREASURY_MANAGE, PERMISSIONS.ALL]), validateRequest(createFundTransferSchema), (req, res, next) => treasuryController.createTransfer(req, res, next));
router.get('/treasury/cheques', authorize([PERMISSIONS.TREASURY_VIEW, PERMISSIONS.ACCOUNTING_VIEW, PERMISSIONS.ALL]), (req, res, next) => treasuryController.getCheques(req, res, next));
router.post('/treasury/cheques', authorize([PERMISSIONS.TREASURY_MANAGE, PERMISSIONS.ALL]), validateRequest(createChequeSchema), (req, res, next) => treasuryController.createCheque(req, res, next));
router.patch('/treasury/cheques/:chequeId/status', authorize([PERMISSIONS.TREASURY_MANAGE, PERMISSIONS.ALL]), validateRequest(updateChequeStatusSchema), (req, res, next) => treasuryController.updateChequeStatus(req, res, next));
router.get('/treasury/accounts/:accountId/ledger', authorize([PERMISSIONS.TREASURY_VIEW, PERMISSIONS.ACCOUNTING_VIEW, PERMISSIONS.ALL]), (req, res, next) => treasuryController.getLedger(req, res, next));
router.put('/treasury/accounts/:accountId/reconciliation/:journalId', authorize([PERMISSIONS.TREASURY_RECONCILE, PERMISSIONS.ALL]), validateRequest(setReconciliationSchema), (req, res, next) => treasuryController.setReconciled(req, res, next));

export const treasuryRouter = router;
