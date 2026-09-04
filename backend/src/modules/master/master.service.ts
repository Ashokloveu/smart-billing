import mongoose from 'mongoose';
import { Organization, IOrganization } from '../../models/Organization.js';
import { Firm, IFirm } from '../../models/Firm.js';
import { FiscalPeriod, IFiscalPeriod } from '../../models/FiscalPeriod.js';
import { Party, IParty } from '../../models/Party.js';
import { Category, ICategory } from '../../models/Category.js';
import { Unit, IUnit } from '../../models/Unit.js';
import { TaxPolicy, ITaxPolicy } from '../../models/TaxPolicy.js';
import { Item, IItem } from '../../models/Item.js';
import { CompanyUser } from '../../models/CompanyUser.js';
import { Role } from '../../models/Role.js';
import { ConflictError, NotFoundError } from '../../errors/AppError.js';
import { PERMISSIONS } from '../../constants/permissions.js';

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}

export class MasterService {
  // Organizations
  public async createOrganization(userId: string, data: any): Promise<IOrganization> {
    const existing = await Organization.findOne({ slug: data.slug });
    if (existing) {
      throw new ConflictError('Organization slug already registered');
    }

    const org = await Organization.create(data);

    // Create Default Owner Role for the Organization
    const ownerRole = await Role.create({
      organizationId: org._id,
      name: 'Owner',
      isSystem: true,
      permissions: [PERMISSIONS.ALL],
    });

    // Create Accountant Role
    await Role.create({
      organizationId: org._id,
      name: 'Accountant',
      isSystem: true,
      permissions: [
        PERMISSIONS.SALE_VIEW,
        PERMISSIONS.PURCHASE_VIEW,
        PERMISSIONS.JOURNAL_CREATE,
        PERMISSIONS.JOURNAL_POST,
        PERMISSIONS.REPORT_VAT_VIEW,
        PERMISSIONS.REPORT_PNL_VIEW,
        PERMISSIONS.PARTY_VIEW,
        PERMISSIONS.ITEM_VIEW,
        PERMISSIONS.ACCOUNTING_VIEW,
        PERMISSIONS.TREASURY_VIEW,
        PERMISSIONS.TREASURY_MANAGE,
        PERMISSIONS.TREASURY_RECONCILE,
      ],
    });

    // Create Default Main Branch Firm
    const mainFirm = await Firm.create({
      organizationId: org._id,
      name: `${org.name} - Head Office`,
      code: 'HQ',
      isHeadOffice: true,
      address: {
        line1: 'Head Office',
        city: data.baseCity || 'Kathmandu',
        district: data.baseCity || 'Kathmandu',
        province: 'Bagmati',
      },
      phone: '+977-1-0000000',
    });

    // Create an immediately usable accounting period. Administrators can replace
    // this with their exact statutory Nepal fiscal-year dates during onboarding.
    const today = new Date();
    const startDate = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    const endDate = new Date(Date.UTC(today.getUTCFullYear(), 11, 31, 23, 59, 59));
    await FiscalPeriod.create({
      organizationId: org._id,
      label: `Setup Period ${today.getUTCFullYear()}`,
      startDate,
      endDate,
      bsStartDate: startDate.toISOString().slice(0, 10),
      bsEndDate: endDate.toISOString().slice(0, 10),
      isCurrent: true,
      isClosed: false,
    });

    // Create Default Nepal 13% VAT Policy
    await TaxPolicy.create({
      organizationId: org._id,
      name: 'Nepal VAT 13%',
      jurisdiction: 'NP',
      taxType: 'VAT',
      rate: mongoose.Types.Decimal128.fromString('13.00'),
      isInclusive: false,
    });

    // Create Default Units
    const defaultUnits = [
      { name: 'Pieces', abbreviation: 'PCS' },
      { name: 'Kilograms', abbreviation: 'KG' },
      { name: 'Bags', abbreviation: 'BAG' },
      { name: 'Liters', abbreviation: 'LTR' },
    ];
    await Unit.insertMany(defaultUnits.map((u) => ({ ...u, organizationId: org._id, isSystem: true })));

    // Bind User as Active Owner
    await CompanyUser.create({
      organizationId: org._id,
      userId: new mongoose.Types.ObjectId(userId),
      roleId: ownerRole._id,
      assignedFirmIds: [mainFirm._id],
      status: 'active',
    });

    return org;
  }

  public async getUserOrganizations(userId: string): Promise<any[]> {
    const memberships = await CompanyUser.find({ userId, status: 'active' })
      .populate('organizationId')
      .populate('roleId');
    return memberships
      .filter((membership) => membership.organizationId)
      .map((membership) => {
        const organization = (membership.organizationId as any).toObject();
        const role = membership.roleId as any;
        return {
          ...organization,
          membership: {
            roleId: role?._id?.toString(),
            roleName: role?.name,
            permissions: role?.permissions || [],
            assignedFirmIds: membership.assignedFirmIds,
          },
        };
      });
  }

  public async getOrganization(orgId: string): Promise<IOrganization> {
    const org = await Organization.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  // Firms (Branches)
  public async createFirm(orgId: string, data: any): Promise<IFirm> {
    const existing = await Firm.findOne({ organizationId: orgId, code: data.code.toUpperCase() });
    if (existing) throw new ConflictError('Firm branch code already in use');
    return Firm.create({ ...data, organizationId: orgId, code: data.code.toUpperCase() });
  }

  public async getFirms(orgId: string): Promise<IFirm[]> {
    return Firm.find({ organizationId: orgId, isActive: true });
  }

  // Fiscal Periods
  public async createFiscalPeriod(orgId: string, data: any): Promise<IFiscalPeriod> {
    if (data.isCurrent) {
      await FiscalPeriod.updateMany({ organizationId: orgId }, { isCurrent: false });
    }
    return FiscalPeriod.create({ ...data, organizationId: orgId });
  }

  public async getFiscalPeriods(orgId: string): Promise<IFiscalPeriod[]> {
    return FiscalPeriod.find({ organizationId: orgId }).sort({ startDate: -1 });
  }

  // Parties (Customers / Suppliers)
  public async createParty(orgId: string, data: any): Promise<IParty> {
    const partyData = {
      ...data,
      organizationId: orgId,
      creditLimit: mongoose.Types.Decimal128.fromString(data.creditLimit || '0.00'),
      openingBalance: {
        amount: mongoose.Types.Decimal128.fromString(data.openingBalance?.amount || '0.00'),
        date: data.openingBalance?.date ? new Date(data.openingBalance.date) : new Date(),
      },
      currentBalance: mongoose.Types.Decimal128.fromString(data.openingBalance?.amount || '0.00'),
    };
    return Party.create(partyData);
  }

  public async getParties(orgId: string, query: PaginationQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: orgId, isActive: true };
    if (query.type && query.type !== 'all') {
      filter.type = query.type;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { panNumber: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, totalRecords] = await Promise.all([
      Party.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Party.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  // Categories & Units
  public async createCategory(orgId: string, data: any): Promise<ICategory> {
    return Category.create({ ...data, organizationId: orgId });
  }

  public async getCategories(orgId: string): Promise<ICategory[]> {
    return Category.find({ organizationId: orgId }).sort({ name: 1 });
  }

  public async createUnit(orgId: string, data: any): Promise<IUnit> {
    return Unit.create({ ...data, organizationId: orgId });
  }

  public async getUnits(orgId: string): Promise<IUnit[]> {
    return Unit.find({ organizationId: orgId }).sort({ name: 1 });
  }

  // Tax Policies
  public async createTaxPolicy(orgId: string, data: any): Promise<ITaxPolicy> {
    return TaxPolicy.create({
      ...data,
      organizationId: orgId,
      rate: mongoose.Types.Decimal128.fromString(data.rate || '13.00'),
    });
  }

  public async getTaxPolicies(orgId: string): Promise<ITaxPolicy[]> {
    return TaxPolicy.find({ organizationId: orgId, isActive: true });
  }

  // Items Catalog
  public async createItem(orgId: string, data: any): Promise<IItem> {
    const existing = await Item.findOne({ organizationId: orgId, code: data.code.toUpperCase() });
    if (existing) throw new ConflictError('Item SKU code already exists');

    const itemData = {
      ...data,
      organizationId: orgId,
      code: data.code.toUpperCase(),
      salePrice: mongoose.Types.Decimal128.fromString(data.salePrice || '0.00'),
      purchasePrice: mongoose.Types.Decimal128.fromString(data.purchasePrice || '0.00'),
      minimumStock: mongoose.Types.Decimal128.fromString(data.minimumStock || '0.00'),
    };
    return Item.create(itemData);
  }

  public async getItems(orgId: string, query: PaginationQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: orgId, isActive: true };
    if (query.type && query.type !== 'all') {
      filter.type = query.type;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { barcode: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, totalRecords] = await Promise.all([
      Item.find(filter)
        .populate('categoryId', 'name')
        .populate('primaryUnitId', 'name abbreviation')
        .populate('taxPolicyId', 'name rate')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Item.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  // Roles & Permissions
  public async getRoles(orgId: string): Promise<any[]> {
    return Role.find({ $or: [{ organizationId: orgId }, { isSystem: true }] });
  }
}

export const masterService = new MasterService();
