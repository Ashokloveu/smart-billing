import { Router } from 'express';
import { masterController } from './master.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  createOrganizationSchema,
  createFirmSchema,
  createFiscalPeriodSchema,
  createPartySchema,
  createCategorySchema,
  createUnitSchema,
  createTaxPolicySchema,
  createItemSchema,
} from './master.validation.js';

const router = Router();

// User Organizations (Global context)
router.get('/organizations', authenticate, (req, res, next) =>
  masterController.getUserOrganizations(req, res, next)
);

router.post(
  '/organizations',
  authenticate,
  validateRequest(createOrganizationSchema),
  (req, res, next) => masterController.createOrganization(req, res, next)
);

// Tenant-Scoped Routes
const orgRouter = Router({ mergeParams: true });
orgRouter.use(authenticate, tenantContext);

// Organization Profile
orgRouter.get('/', authorize([PERMISSIONS.ORGANIZATION_VIEW, PERMISSIONS.ALL]), (req, res, next) =>
  masterController.getOrganization(req, res, next)
);

// Firms / Branches
orgRouter.get('/firms', (req, res, next) => masterController.getFirms(req, res, next));
orgRouter.post(
  '/firms',
  authorize([PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ALL]),
  validateRequest(createFirmSchema),
  (req, res, next) => masterController.createFirm(req, res, next)
);

// Fiscal Periods
orgRouter.get('/fiscal-years', (req, res, next) => masterController.getFiscalPeriods(req, res, next));
orgRouter.post(
  '/fiscal-years',
  authorize([PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ALL]),
  validateRequest(createFiscalPeriodSchema),
  (req, res, next) => masterController.createFiscalPeriod(req, res, next)
);

// Parties (Customers & Suppliers)
orgRouter.get('/parties', authorize([PERMISSIONS.PARTY_VIEW, PERMISSIONS.ALL]), (req, res, next) =>
  masterController.getParties(req, res, next)
);
orgRouter.post(
  '/parties',
  authorize([PERMISSIONS.PARTY_CREATE, PERMISSIONS.ALL]),
  validateRequest(createPartySchema),
  (req, res, next) => masterController.createParty(req, res, next)
);

// Categories & Units
orgRouter.get('/categories', (req, res, next) => masterController.getCategories(req, res, next));
orgRouter.post(
  '/categories',
  authorize([PERMISSIONS.ITEM_CREATE, PERMISSIONS.ALL]),
  validateRequest(createCategorySchema),
  (req, res, next) => masterController.createCategory(req, res, next)
);

orgRouter.get('/units', (req, res, next) => masterController.getUnits(req, res, next));
orgRouter.post(
  '/units',
  authorize([PERMISSIONS.ITEM_CREATE, PERMISSIONS.ALL]),
  validateRequest(createUnitSchema),
  (req, res, next) => masterController.createUnit(req, res, next)
);

// Tax Policies
orgRouter.get('/tax-policies', (req, res, next) => masterController.getTaxPolicies(req, res, next));
orgRouter.post(
  '/tax-policies',
  authorize([PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ALL]),
  validateRequest(createTaxPolicySchema),
  (req, res, next) => masterController.createTaxPolicy(req, res, next)
);

// Items & Services Catalog
orgRouter.get('/items', authorize([PERMISSIONS.ITEM_VIEW, PERMISSIONS.ALL]), (req, res, next) =>
  masterController.getItems(req, res, next)
);
orgRouter.post(
  '/items',
  authorize([PERMISSIONS.ITEM_CREATE, PERMISSIONS.ALL]),
  validateRequest(createItemSchema),
  (req, res, next) => masterController.createItem(req, res, next)
);

// Roles
orgRouter.get('/roles', (req, res, next) => masterController.getRoles(req, res, next));

// Mount under router
router.use('/organizations/:orgId', orgRouter);

export const masterRouter = router;
