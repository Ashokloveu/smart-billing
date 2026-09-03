import mongoose from 'mongoose';
import { Lead, ILead } from '../models/Lead.js';
import { Opportunity, IOpportunity } from '../models/Opportunity.js';
import { Quotation, IQuotation } from '../models/Quotation.js';
import { CustomerActivity, ICustomerActivity } from '../models/CustomerActivity.js';
import { SalesTarget, ISalesTarget } from '../models/SalesTarget.js';
import { Party } from '../../../models/Party.js';
import { Item } from '../../../models/Item.js';
import { SalesOrder } from '../../../models/SalesOrder.js';
import { Transaction } from '../../../models/Transaction.js';
import { Notification } from '../../../models/Notification.js';
import { AuditLog } from '../../../models/AuditLog.js';
import { User } from '../../../models/User.js';
import { AppError } from '../../../errors/AppError.js';
import {
  LeadDTO,
  OpportunityDTO,
  QuotationDTO,
  ActivityDTO,
  SalesTargetDTO,
} from '../types/crm.types.js';

export class CrmService {
  // ==========================================
  // 1. Duplicate Detection
  // ==========================================
  public async checkDuplicates(orgId: string, criteria: { phone?: string; email?: string; panNumber?: string }) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const conditions: any[] = [];
    if (criteria.phone) conditions.push({ phone: criteria.phone.trim() });
    if (criteria.email) conditions.push({ email: criteria.email.trim().toLowerCase() });
    if (criteria.panNumber) conditions.push({ panNumber: criteria.panNumber.trim() });

    if (conditions.length === 0) return { hasDuplicate: false, matches: [] };

    const [parties, leads] = await Promise.all([
      Party.find({ organizationId: orgObjectId, $or: conditions }).select('name email phone panNumber type').lean(),
      Lead.find({ organizationId: orgObjectId, deletedAt: null, $or: conditions }).select('companyName contactPerson email phone status').lean(),
    ]);

    const matches = [
      ...parties.map((p) => ({ type: 'customer', id: p._id, name: p.name, email: p.email, phone: p.phone })),
      ...leads.map((l) => ({ type: 'lead', id: l._id, name: l.companyName, email: l.email, phone: l.phone })),
    ];

    return { hasDuplicate: matches.length > 0, matches };
  }

  // ==========================================
  // 2. Lead Management & Round-Robin
  // ==========================================
  public async getLeads(orgId: string, query: any) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(100, parseInt(query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: orgObjectId, deletedAt: null };
    if (query.status) filter.status = query.status;
    if (query.assignedTo) filter.assignedTo = new mongoose.Types.ObjectId(query.assignedTo);
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ companyName: regex }, { contactPerson: regex }, { phone: regex }, { email: regex }];
    }

    const [items, total] = await Promise.all([
      Lead.find(filter).populate('assignedTo', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  public async createLead(orgId: string, dto: LeadDTO, userId: string, clientIp?: string): Promise<ILead> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const count = await Lead.countDocuments({ organizationId: orgObjectId });
    const leadNumber = `LEAD-${String(count + 1).padStart(4, '0')}`;

    let assignedTo = dto.assignedTo ? new mongoose.Types.ObjectId(dto.assignedTo) : undefined;

    // Round-robin assignment if unassigned
    if (!assignedTo) {
      const salesReps = await User.find({ organizationId: orgObjectId, isActive: true }).select('_id');
      if (salesReps.length > 0) {
        const nextIndex = count % salesReps.length;
        assignedTo = salesReps[nextIndex]._id;
      }
    }

    const lead = await Lead.create({
      organizationId: orgObjectId,
      firmId: new mongoose.Types.ObjectId(dto.firmId),
      leadNumber,
      companyName: dto.companyName.trim(),
      contactPerson: dto.contactPerson.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      panNumber: dto.panNumber?.trim(),
      source: dto.source || 'website',
      status: 'new',
      score: 60,
      estimatedValue: mongoose.Types.Decimal128.fromString(parseFloat(dto.estimatedValue?.toString() || '0').toFixed(2)),
      assignedTo,
      nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : undefined,
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    if (assignedTo) {
      await Notification.create({
        organizationId: orgObjectId,
        userId: assignedTo,
        type: 'approval_request',
        title: `New Lead Assigned: ${lead.companyName}`,
        message: `Lead ${lead.leadNumber} has been assigned to you.`,
        referenceDocument: lead.leadNumber,
      });
    }

    await AuditLog.create({
      organizationId: orgObjectId,
      userId: new mongoose.Types.ObjectId(userId),
      action: 'lead_created',
      entityType: 'Lead',
      entityId: lead._id,
      ipAddress: clientIp,
      newValue: { leadNumber, companyName: lead.companyName },
    });

    return lead;
  }

  public async convertLeadToCustomer(orgId: string, leadId: string, userId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const lead = await Lead.findOne({ _id: leadId, organizationId: orgObjectId, deletedAt: null }).session(session);
      if (!lead) throw new AppError(404, 'NOT_FOUND', 'Lead not found');
      if (lead.convertedPartyId) throw new AppError(400, 'ALREADY_CONVERTED', 'Lead is already converted to customer');

      // Create permanent Customer (Party)
      const party = await Party.create(
        [
          {
            organizationId: orgObjectId,
            type: 'customer',
            name: lead.companyName,
            panNumber: lead.panNumber,
            email: lead.email,
            phone: lead.phone,
            billingAddress: { line1: '', city: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati' },
            creditLimit: mongoose.Types.Decimal128.fromString('100000.00'),
            currentBalance: mongoose.Types.Decimal128.fromString('0.00'),
            isActive: true,
          },
        ],
        { session }
      );

      // Create initial Opportunity
      const oppCount = await Opportunity.countDocuments({ organizationId: orgObjectId });
      const opportunityNumber = `OPP-${String(oppCount + 1).padStart(4, '0')}`;
      const oppRevenue = parseFloat(lead.estimatedValue.toString()) || 50000;
      const prob = 50;

      const opp = await Opportunity.create(
        [
          {
            organizationId: orgObjectId,
            firmId: lead.firmId,
            opportunityNumber,
            title: `Opportunity with ${lead.companyName}`,
            customerId: party[0]._id,
            leadId: lead._id,
            stage: 'qualification',
            expectedRevenue: mongoose.Types.Decimal128.fromString(oppRevenue.toFixed(2)),
            probability: prob,
            weightedRevenue: mongoose.Types.Decimal128.fromString((oppRevenue * (prob / 100)).toFixed(2)),
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
            salesOwner: lead.assignedTo || new mongoose.Types.ObjectId(userId),
            createdBy: new mongoose.Types.ObjectId(userId),
            updatedBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      lead.status = 'won';
      lead.convertedPartyId = party[0]._id;
      lead.convertedOpportunityId = opp[0]._id;
      lead.updatedBy = new mongoose.Types.ObjectId(userId);
      await lead.save({ session });

      await session.commitTransaction();
      return { customer: party[0], opportunity: opp[0] };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ==========================================
  // 3. Customer 360 Aggregation
  // ==========================================
  public async getCustomer360(orgId: string, customerId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const custObjectId = new mongoose.Types.ObjectId(customerId);

    const customer = await Party.findOne({ _id: custObjectId, organizationId: orgObjectId }).lean();
    if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer not found');

    const [invoices, quotations, opportunities, activities] = await Promise.all([
      Transaction.find({ organizationId: orgObjectId, partyId: custObjectId })
        .sort({ date: -1 })
        .limit(20)
        .lean(),
      Quotation.find({ organizationId: orgObjectId, customerId: custObjectId, deletedAt: null })
        .sort({ quotationDate: -1 })
        .lean(),
      Opportunity.find({ organizationId: orgObjectId, customerId: custObjectId, deletedAt: null })
        .sort({ createdAt: -1 })
        .lean(),
      CustomerActivity.find({ organizationId: orgObjectId, customerId: custObjectId, deletedAt: null })
        .sort({ timestamp: -1 })
        .limit(30)
        .lean(),
    ]);

    const creditLimit = parseFloat(customer.creditLimit?.toString() || '0');
    const currentBalance = parseFloat(customer.currentBalance?.toString() || '0');
    const availableCredit = Math.max(0, creditLimit - currentBalance);

    return {
      customer,
      credit: {
        creditLimit,
        currentBalance,
        availableCredit,
        status: currentBalance > creditLimit && creditLimit > 0 ? 'breached' : 'normal',
      },
      invoices,
      quotations,
      opportunities,
      activities,
    };
  }

  // ==========================================
  // 4. Quotations & Conversion
  // ==========================================
  public async getQuotations(orgId: string, query: any) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const filter: any = { organizationId: orgObjectId, deletedAt: null };
    if (query.customerId) filter.customerId = new mongoose.Types.ObjectId(query.customerId);
    if (query.status) filter.status = query.status;

    return Quotation.find(filter)
      .populate('customerId', 'name email phone panNumber')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async createQuotation(orgId: string, dto: QuotationDTO, userId: string): Promise<IQuotation> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const customer = await Party.findOne({ _id: new mongoose.Types.ObjectId(dto.customerId), organizationId: orgObjectId });
    if (!customer) throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');

    const count = await Quotation.countDocuments({ organizationId: orgObjectId });
    const quotationNumber = `QUO-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let taxTotal = 0;
    const items: any[] = [];

    for (const itm of dto.items) {
      const itemDoc = await Item.findById(itm.itemId);
      const qty = parseFloat(itm.quantity.toString());
      const rate = parseFloat(itm.rate.toString());
      const discount = parseFloat(itm.discountAmount?.toString() || '0');
      const taxable = (qty * rate) - discount;
      const tax = taxable * 0.13;
      const total = taxable + tax;

      subtotal += taxable;
      taxTotal += tax;

      items.push({
        itemId: new mongoose.Types.ObjectId(itm.itemId),
        itemName: itemDoc?.name || 'Item',
        quantity: mongoose.Types.Decimal128.fromString(qty.toFixed(4)),
        rate: mongoose.Types.Decimal128.fromString(rate.toFixed(2)),
        discountAmount: mongoose.Types.Decimal128.fromString(discount.toFixed(2)),
        taxableAmount: mongoose.Types.Decimal128.fromString(taxable.toFixed(2)),
        taxRate: mongoose.Types.Decimal128.fromString('13.00'),
        taxAmount: mongoose.Types.Decimal128.fromString(tax.toFixed(2)),
        totalAmount: mongoose.Types.Decimal128.fromString(total.toFixed(2)),
      });
    }

    const grandTotal = subtotal + taxTotal;

    return Quotation.create({
      organizationId: orgObjectId,
      firmId: new mongoose.Types.ObjectId(dto.firmId),
      financialYearId: new mongoose.Types.ObjectId(dto.financialYearId),
      quotationNumber,
      version: 1,
      customerId: customer._id,
      customerName: customer.name,
      customerPan: customer.panNumber,
      opportunityId: dto.opportunityId ? new mongoose.Types.ObjectId(dto.opportunityId) : undefined,
      quotationDate: dto.quotationDate ? new Date(dto.quotationDate) : new Date(),
      validUntil: new Date(dto.validUntil),
      status: 'approved',
      items,
      subtotal: mongoose.Types.Decimal128.fromString(subtotal.toFixed(2)),
      taxTotal: mongoose.Types.Decimal128.fromString(taxTotal.toFixed(2)),
      grandTotal: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
      termsAndConditions: dto.termsAndConditions,
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });
  }

  public async convertQuotationToSalesOrder(orgId: string, quotationId: string, userId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const quotation = await Quotation.findOne({ _id: quotationId, organizationId: orgObjectId, deletedAt: null }).session(session);
      if (!quotation) throw new AppError(404, 'NOT_FOUND', 'Quotation not found');
      if (quotation.status === 'converted') throw new AppError(400, 'ALREADY_CONVERTED', 'Quotation already converted to Sales Order');

      const soCount = await SalesOrder.countDocuments({ organizationId: orgObjectId });
      const soNumber = `SO-${String(soCount + 1).padStart(4, '0')}`;

      const so = await SalesOrder.create(
        [
          {
            organizationId: orgObjectId,
            firmId: quotation.firmId,
            financialYearId: quotation.financialYearId,
            soNumber,
            customerId: quotation.customerId,
            customerName: quotation.customerName,
            customerPan: quotation.customerPan,
            quotationNumber: quotation.quotationNumber,
            orderDate: new Date(),
            status: 'confirmed',
            items: quotation.items.map((i) => ({
              itemId: i.itemId,
              itemName: i.itemName,
              orderedQuantity: i.quantity,
              deliveredQuantity: mongoose.Types.Decimal128.fromString('0.00'),
              rate: i.rate,
              discountAmount: i.discountAmount,
              taxableAmount: i.taxableAmount,
              taxRate: i.taxRate,
              taxAmount: i.taxAmount,
              totalAmount: i.totalAmount,
            })),
            subtotal: quotation.subtotal,
            taxTotal: quotation.taxTotal,
            grandTotal: quotation.grandTotal,
            creditCheckStatus: 'approved',
            createdBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      quotation.status = 'converted';
      quotation.convertedSalesOrderId = so[0]._id;
      quotation.updatedBy = new mongoose.Types.ObjectId(userId);
      await quotation.save({ session });

      await session.commitTransaction();
      return so[0];
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ==========================================
  // 5. Activities & Targets
  // ==========================================
  public async recordActivity(orgId: string, dto: ActivityDTO, userId: string): Promise<ICustomerActivity> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    return CustomerActivity.create({
      organizationId: orgObjectId,
      customerId: dto.customerId ? new mongoose.Types.ObjectId(dto.customerId) : undefined,
      leadId: dto.leadId ? new mongoose.Types.ObjectId(dto.leadId) : undefined,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      performedBy: new mongoose.Types.ObjectId(userId),
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });
  }

  public async getSalesTargets(orgId: string) {
    return SalesTarget.find({ organizationId: new mongoose.Types.ObjectId(orgId), deletedAt: null })
      .populate('userId', 'fullName email')
      .lean();
  }

  public async createSalesTarget(orgId: string, dto: SalesTargetDTO, userId: string): Promise<ISalesTarget> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const amount = mongoose.Types.Decimal128.fromString(parseFloat(dto.targetAmount.toString()).toFixed(2));

    return SalesTarget.findOneAndUpdate(
      { organizationId: orgObjectId, userId: new mongoose.Types.ObjectId(dto.userId), periodName: dto.periodName },
      {
        $set: {
          periodType: dto.periodType || 'monthly',
          targetAmount: amount,
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
        $setOnInsert: {
          createdBy: new mongoose.Types.ObjectId(userId),
        },
      },
      { upsert: true, new: true }
    );
  }

  // ==========================================
  // 6. Opportunities
  // ==========================================
  public async getOpportunities(orgId: string) {
    return Opportunity.find({ organizationId: new mongoose.Types.ObjectId(orgId), deletedAt: null })
      .populate('customerId', 'name email phone')
      .populate('salesOwner', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async createOpportunity(orgId: string, dto: OpportunityDTO, userId: string): Promise<IOpportunity> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const count = await Opportunity.countDocuments({ organizationId: orgObjectId });
    const opportunityNumber = `OPP-${String(count + 1).padStart(4, '0')}`;
    const rev = parseFloat(dto.expectedRevenue.toString());
    const prob = dto.probability || 30;

    return Opportunity.create({
      organizationId: orgObjectId,
      firmId: new mongoose.Types.ObjectId(dto.firmId),
      opportunityNumber,
      title: dto.title.trim(),
      customerId: new mongoose.Types.ObjectId(dto.customerId),
      leadId: dto.leadId ? new mongoose.Types.ObjectId(dto.leadId) : undefined,
      stage: dto.stage || 'prospecting',
      expectedRevenue: mongoose.Types.Decimal128.fromString(rev.toFixed(2)),
      probability: prob,
      weightedRevenue: mongoose.Types.Decimal128.fromString((rev * (prob / 100)).toFixed(2)),
      expectedCloseDate: new Date(dto.expectedCloseDate),
      salesOwner: new mongoose.Types.ObjectId(dto.salesOwner),
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });
  }

  public async updateOpportunityStage(orgId: string, id: string, stage: string, userId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const opp = await Opportunity.findOne({ _id: id, organizationId: orgObjectId, deletedAt: null });
    if (!opp) throw new AppError(404, 'NOT_FOUND', 'Opportunity not found');

    opp.stage = stage as any;
    if (stage === 'closed_won') opp.probability = 100;
    else if (stage === 'closed_lost') opp.probability = 0;

    const rev = parseFloat(opp.expectedRevenue.toString());
    opp.weightedRevenue = mongoose.Types.Decimal128.fromString((rev * (opp.probability / 100)).toFixed(2));
    opp.updatedBy = new mongoose.Types.ObjectId(userId);
    await opp.save();

    return opp;
  }
}

export const crmService = new CrmService();
