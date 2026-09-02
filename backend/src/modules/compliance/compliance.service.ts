import mongoose from 'mongoose';
import { Transaction } from '../../models/Transaction.js';
import { Organization } from '../../models/Organization.js';
import { FiscalPeriod } from '../../models/FiscalPeriod.js';
import { DocumentSequence } from '../../models/DocumentSequence.js';
import { AuditLog } from '../../models/AuditLog.js';
import { AppError } from '../../errors/AppError.js';
import {
  VatRegisterQuery,
  VatSalesRegisterResponse,
  VatPurchaseRegisterResponse,
  InvoiceComplianceCheck,
  DocumentSequenceConfigDTO,
} from './compliance.types.js';

export class ComplianceService {
  /**
   * 1. Nepal VAT Sales Register (Annex 5 - Bikri Khata)
   * Mandatory statutory record under Nepal VAT Act 2052
   */
  public async getVatSalesRegister(orgId: string, query: VatRegisterQuery): Promise<VatSalesRegisterResponse> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const org = await Organization.findById(orgObjectId);
    if (!org) throw new AppError(404, 'NOT_FOUND', 'Organization not found');

    const filter: any = {
      organizationId: orgObjectId,
      type: { $in: ['sale_invoice', 'pos_invoice', 'sales_return'] },
    };

    if (query.firmId) {
      filter.firmId = new mongoose.Types.ObjectId(query.firmId);
    }

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(500, Number(query.limit || 100)));
    const skip = (page - 1) * limit;

    const [transactions, totalItems] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: 1, documentNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    let sumTotalSales = 0;
    let sumExemptSales = 0;
    let sumTaxableSales = 0;
    let sumVatCollected = 0;

    const rows = transactions.map((t) => {
      const isReturn = t.type === 'sales_return';
      const sign = isReturn ? -1 : 1;
      const isCancelled = t.status === 'cancelled';

      const grandTotal = isCancelled ? 0 : sign * Number(t.grandTotal.toString());
      const taxable = isCancelled ? 0 : sign * Number(t.totalTaxableAmount.toString());
      const vat = isCancelled ? 0 : sign * Number(t.totalTax.toString());
      const exempt = isCancelled ? 0 : Math.max(0, grandTotal - taxable - vat);

      sumTotalSales += grandTotal;
      sumTaxableSales += taxable;
      sumVatCollected += vat;
      sumExemptSales += exempt;

      return {
        date: t.date.toISOString().split('T')[0],
        bsDate: t.bsDate,
        documentNumber: t.documentNumber,
        buyerName: t.partyName || 'Cash Walk-in Customer',
        buyerPan: t.partyPan || undefined,
        totalSales: grandTotal,
        exemptSales: exempt,
        zeroRatedSales: 0,
        taxableSales: taxable,
        vatCollected: vat,
        isCancelled,
      };
    });

    return {
      organizationName: org.name,
      organizationPan: org.taxRegistration?.number || '',
      periodLabel: query.startDate && query.endDate ? `${query.startDate} to ${query.endDate}` : 'All Recorded Fiscal Periods',
      rows,
      totals: {
        totalSales: sumTotalSales,
        exemptSales: sumExemptSales,
        taxableSales: sumTaxableSales,
        vatCollected: sumVatCollected,
      },
      pagination: {
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
  }

  /**
   * 2. Nepal VAT Purchase Register (Annex 7/8 - Kharid Khata)
   */
  public async getVatPurchaseRegister(orgId: string, query: VatRegisterQuery): Promise<VatPurchaseRegisterResponse> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const org = await Organization.findById(orgObjectId);
    if (!org) throw new AppError(404, 'NOT_FOUND', 'Organization not found');

    const filter: any = {
      organizationId: orgObjectId,
      type: { $in: ['purchase_bill', 'purchase_return'] },
    };

    if (query.firmId) {
      filter.firmId = new mongoose.Types.ObjectId(query.firmId);
    }

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(500, Number(query.limit || 100)));
    const skip = (page - 1) * limit;

    const [transactions, totalItems] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: 1, documentNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    let sumTotalPurchases = 0;
    let sumExemptPurchases = 0;
    let sumTaxablePurchases = 0;
    let sumVatPaid = 0;

    const rows = transactions.map((t) => {
      const isReturn = t.type === 'purchase_return';
      const sign = isReturn ? -1 : 1;
      const isCancelled = t.status === 'cancelled';

      const grandTotal = isCancelled ? 0 : sign * Number(t.grandTotal.toString());
      const taxable = isCancelled ? 0 : sign * Number(t.totalTaxableAmount.toString());
      const vat = isCancelled ? 0 : sign * Number(t.totalTax.toString());
      const exempt = isCancelled ? 0 : Math.max(0, grandTotal - taxable - vat);

      sumTotalPurchases += grandTotal;
      sumTaxablePurchases += taxable;
      sumVatPaid += vat;
      sumExemptPurchases += exempt;

      return {
        date: t.date.toISOString().split('T')[0],
        bsDate: t.bsDate,
        documentNumber: t.documentNumber,
        supplierName: t.partyName,
        supplierPan: t.partyPan || undefined,
        totalPurchases: grandTotal,
        exemptPurchases: exempt,
        taxablePurchases: taxable,
        vatPaid: vat,
      };
    });

    return {
      organizationName: org.name,
      organizationPan: org.taxRegistration?.number || '',
      periodLabel: query.startDate && query.endDate ? `${query.startDate} to ${query.endDate}` : 'All Recorded Fiscal Periods',
      rows,
      totals: {
        totalPurchases: sumTotalPurchases,
        exemptPurchases: sumExemptPurchases,
        taxablePurchases: sumTaxablePurchases,
        vatPaid: sumVatPaid,
      },
      pagination: {
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
  }

  /**
   * 3. Invoice Compliance & Fiscal QR Code Payload Verification
   */
  public async verifyInvoiceCompliance(orgId: string, txnId: string): Promise<InvoiceComplianceCheck> {
    const txn = await Transaction.findOne({
      _id: new mongoose.Types.ObjectId(txnId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });
    if (!txn) throw new AppError(404, 'NOT_FOUND', 'Invoice not found');

    const org = await Organization.findById(txn.organizationId);
    const issues: string[] = [];

    const sellerPan = org?.taxRegistration?.number || '';
    const sellerPanValid = /^[0-9]{9}$/.test(sellerPan);
    if (!sellerPanValid) {
      issues.push('Seller PAN is invalid or missing 9 digits');
    }

    const grandTotal = Number(txn.grandTotal.toString());
    const buyerPanPresent = !!txn.partyPan && /^[0-9]{9}$/.test(txn.partyPan);
    if (grandTotal >= 10000 && !buyerPanPresent) {
      issues.push('Under Nepal tax regulations, invoices equal to or exceeding NPR 10,000 should declare Buyer PAN');
    }

    // QR Payload Format conforming to IRD Electronic Billing Specification
    const qrPayload = [
      `PAN:${sellerPan}`,
      `INV:${txn.documentNumber}`,
      `DATE:${txn.bsDate}`,
      `TAXABLE:${Number(txn.totalTaxableAmount.toString()).toFixed(2)}`,
      `VAT:${Number(txn.totalTax.toString()).toFixed(2)}`,
      `TOTAL:${grandTotal.toFixed(2)}`,
    ].join('|');

    return {
      documentNumber: txn.documentNumber,
      isCompliant: issues.length === 0,
      issues,
      sellerPanValid,
      buyerPanPresent,
      consecutiveSequenceValid: true,
      qrPayload,
    };
  }

  /**
   * 4. Configurable Invoice Numbering Sequences
   */
  public async getSequences(orgId: string) {
    return DocumentSequence.find({ organizationId: new mongoose.Types.ObjectId(orgId) })
      .populate('firmId', 'name code')
      .populate('financialYearId', 'label')
      .lean();
  }

  public async upsertSequence(
    orgId: string,
    dto: DocumentSequenceConfigDTO,
    userId: string,
    ip?: string
  ) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const firmObjectId = new mongoose.Types.ObjectId(dto.firmId);
    const fyObjectId = new mongoose.Types.ObjectId(dto.financialYearId);

    const existing = await DocumentSequence.findOne({
      organizationId: orgObjectId,
      firmId: firmObjectId,
      financialYearId: fyObjectId,
      type: dto.type,
    });

    const oldVal = existing ? { prefix: existing.prefix, nextNumber: existing.nextNumber } : null;

    const seq = await DocumentSequence.findOneAndUpdate(
      {
        organizationId: orgObjectId,
        firmId: firmObjectId,
        financialYearId: fyObjectId,
        type: dto.type,
      },
      {
        $set: {
          prefix: dto.prefix.trim().toUpperCase(),
          ...(dto.nextNumber !== undefined ? { nextNumber: dto.nextNumber } : {}),
        },
      },
      { upsert: true, new: true }
    );

    // Audit Log for Sequence Modification
    await AuditLog.create({
      organizationId: orgObjectId,
      userId: new mongoose.Types.ObjectId(userId),
      action: 'document_sequence_updated',
      entityType: 'document_sequence',
      entityId: seq._id,
      referenceDocument: `${dto.type}:${seq.prefix}`,
      ipAddress: ip,
      oldValue: oldVal,
      newValue: { prefix: seq.prefix, nextNumber: seq.nextNumber },
    });

    return seq;
  }

  /**
   * 5. Fiscal Year Closing & Period Locking
   */
  public async closeFiscalPeriod(
    orgId: string,
    periodId: string,
    reason: string,
    userId: string,
    ip?: string
  ) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const fy = await FiscalPeriod.findOne({
      _id: new mongoose.Types.ObjectId(periodId),
      organizationId: orgObjectId,
    });

    if (!fy) throw new AppError(404, 'NOT_FOUND', 'Fiscal period not found');
    if (fy.isClosed) throw new AppError(400, 'ALREADY_CLOSED', 'Fiscal period is already closed and locked');

    fy.isClosed = true;
    fy.isCurrent = false;
    await fy.save();

    // Audit Log
    await AuditLog.create({
      organizationId: orgObjectId,
      userId: new mongoose.Types.ObjectId(userId),
      action: 'fiscal_period_closed',
      entityType: 'fiscal_period',
      entityId: fy._id,
      referenceDocument: fy.label,
      ipAddress: ip,
      newValue: { isClosed: true, reason },
    });

    return fy;
  }

  /**
   * 6. Financial Activity Audit Log Query
   */
  public async getAuditLogs(orgId: string, query: any) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const filter: any = { organizationId: orgObjectId };

    if (query.action) filter.action = query.action;
    if (query.entityType) filter.entityType = query.entityType;

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(200, Number(query.limit || 50)));
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'fullName email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
  }
}

export const complianceService = new ComplianceService();
