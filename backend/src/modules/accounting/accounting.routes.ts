import { Router } from 'express';
import { accountingController } from './accounting.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  createAccountSchema,
  createJournalEntrySchema,
  rejectJournalSchema,
  reverseJournalSchema,
  bulkOpeningBalanceSchema,
} from './accounting.validation.js';

const router = Router({ mergeParams: true });
router.use(authenticate, tenantContext);

// 1. Chart of Accounts
router.get(
  '/accounting/accounts',
  authorize([PERMISSIONS.ACCOUNTING_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getAccounts(req, res, next)
);

router.post(
  '/accounting/accounts',
  authorize([PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.ALL]),
  validateRequest(createAccountSchema),
  (req, res, next) => accountingController.createAccount(req, res, next)
);

// 2. Journal Vouchers
router.get(
  '/accounting/journals',
  authorize([PERMISSIONS.JOURNAL_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getJournals(req, res, next)
);

router.post(
  '/accounting/journals',
  authorize([PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.ALL]),
  validateRequest(createJournalEntrySchema),
  (req, res, next) => accountingController.createJournalEntry(req, res, next)
);

// 3. Approval Workflow Endpoints
router.post(
  '/accounting/journals/:id/submit',
  authorize([PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.submitJournal(req, res, next)
);

router.post(
  '/accounting/journals/:id/approve',
  authorize([PERMISSIONS.JOURNAL_APPROVE, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.approveJournal(req, res, next)
);

router.post(
  '/accounting/journals/:id/post',
  authorize([PERMISSIONS.JOURNAL_POST, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.postJournal(req, res, next)
);

router.post(
  '/accounting/journals/:id/reject',
  authorize([PERMISSIONS.JOURNAL_APPROVE, PERMISSIONS.ALL]),
  validateRequest(rejectJournalSchema),
  (req, res, next) => accountingController.rejectJournal(req, res, next)
);

router.post(
  '/accounting/journals/:id/reverse',
  authorize([PERMISSIONS.JOURNAL_CANCEL, PERMISSIONS.ALL]),
  validateRequest(reverseJournalSchema),
  (req, res, next) => accountingController.reverseJournal(req, res, next)
);

// 4. Opening Balance Ingestion
router.post(
  '/accounting/opening-balances',
  authorize([PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.ALL]),
  validateRequest(bulkOpeningBalanceSchema),
  (req, res, next) => accountingController.setOpeningBalances(req, res, next)
);

// 5. Ledgers & Statements
router.get(
  '/accounting/ledgers/:accountId',
  authorize([PERMISSIONS.ACCOUNTING_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getAccountLedger(req, res, next)
);

router.get(
  '/accounting/day-book',
  authorize([PERMISSIONS.ACCOUNTING_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getDayBook(req, res, next)
);

router.get(
  '/accounting/trial-balance',
  authorize([PERMISSIONS.ACCOUNTING_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getTrialBalance(req, res, next)
);

router.get(
  '/accounting/profit-loss',
  authorize([PERMISSIONS.REPORT_PNL_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getProfitLoss(req, res, next)
);

router.get(
  '/accounting/balance-sheet',
  authorize([PERMISSIONS.REPORT_BALANCE_SHEET_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getBalanceSheet(req, res, next)
);

router.get(
  '/accounting/cash-flow',
  authorize([PERMISSIONS.REPORT_CASHFLOW_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getCashFlow(req, res, next)
);

router.get(
  '/accounting/tax-summary',
  authorize([PERMISSIONS.REPORT_VAT_VIEW, PERMISSIONS.ALL]),
  (req, res, next) => accountingController.getTaxSummary(req, res, next)
);

export const accountingRouter = router;
