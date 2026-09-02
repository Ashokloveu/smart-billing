import mongoose from 'mongoose';
import { Account } from '../../models/Account.js';
import { JournalEntry, IJournalEntry } from '../../models/JournalEntry.js';
import { AuditLog } from '../../models/AuditLog.js';
import { FiscalPeriod } from '../../models/FiscalPeriod.js';
import { DocumentSequence } from '../../models/DocumentSequence.js';
import { Organization } from '../../models/Organization.js';
import { AppError } from '../../errors/AppError.js';
import {
  CreateAccountDTO,
  CreateJournalEntryDTO,
  BulkOpeningBalanceDTO,
  AccountLedgerResponse,
  DayBookItem,
  TrialBalanceResponse,
  ProfitLossStatement,
  BalanceSheetStatement,
  CashFlowStatement,
  TaxSummaryReport,
} from './accounting.types.js';

export class AccountingService {
  // 1. Seed Standard Nepal Chart of Accounts
  public async seedStandardChartOfAccounts(orgId: string): Promise<void> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const count = await Account.countDocuments({ organizationId: orgObjectId });
    if (count > 0) return;

    const standardCOA = [
      // 1xxx ASSETS
      { code: '1110', name: 'Cash in Hand', type: 'asset', group: 'Current Assets', isSystem: true },
      { code: '1120', name: 'Bank Accounts', type: 'asset', group: 'Current Assets', isSystem: true },
      { code: '1130', name: 'Accounts Receivable (Debtors)', type: 'asset', group: 'Current Assets', isSystem: true },
      { code: '1140', name: 'Inventory Asset (Stock-in-Hand)', type: 'asset', group: 'Current Assets', isSystem: true },
      { code: '1150', name: 'Input VAT Receivable', type: 'asset', group: 'Current Assets', isSystem: true },
      { code: '1210', name: 'Furniture & Fixtures', type: 'asset', group: 'Fixed Assets', isSystem: false },
      { code: '1220', name: 'Computer & Office Equipment', type: 'asset', group: 'Fixed Assets', isSystem: false },

      // 2xxx LIABILITIES
      { code: '2110', name: 'Accounts Payable (Creditors)', type: 'liability', group: 'Current Liabilities', isSystem: true },
      { code: '2120', name: 'Output VAT Payable', type: 'liability', group: 'Current Liabilities', isSystem: true },
      { code: '2130', name: 'TDS / Withholding Tax Payable', type: 'liability', group: 'Current Liabilities', isSystem: true },
      { code: '2140', name: 'Accrued Expenses Payable', type: 'liability', group: 'Current Liabilities', isSystem: true },
      { code: '2210', name: 'Bank Loans & Borrowings', type: 'liability', group: 'Long-term Liabilities', isSystem: false },

      // 3xxx EQUITY
      { code: '3100', name: 'Owner / Share Capital', type: 'equity', group: 'Equity', isSystem: true },
      { code: '3200', name: 'Retained Earnings', type: 'equity', group: 'Equity', isSystem: true },
      { code: '3999', name: 'Opening Balance Suspense', type: 'equity', group: 'Equity', isSystem: true },

      // 4xxx INCOME / REVENUE
      { code: '4100', name: 'Sales Revenue', type: 'income', group: 'Operating Revenue', isSystem: true },
      { code: '4110', name: 'Sales Returns & Discounts', type: 'income', group: 'Operating Revenue', isSystem: true },
      { code: '4200', name: 'Other Income', type: 'income', group: 'Non-Operating Income', isSystem: false },

      // 5xxx EXPENSES
      { code: '5100', name: 'Cost of Goods Sold (Purchases)', type: 'expense', group: 'Direct Costs', isSystem: true },
      { code: '5110', name: 'Purchase Discounts Received', type: 'expense', group: 'Direct Costs', isSystem: true },
      { code: '5210', name: 'Office Rent Expense', type: 'expense', group: 'Operating Expenses', isSystem: false },
      { code: '5220', name: 'Salaries & Wages', type: 'expense', group: 'Operating Expenses', isSystem: false },
      { code: '5230', name: 'Electricity & Utilities', type: 'expense', group: 'Operating Expenses', isSystem: false },
      { code: '5240', name: 'Communication & Internet', type: 'expense', group: 'Operating Expenses', isSystem: false },
      { code: '5310', name: 'Inventory Loss / Shrinkage', type: 'expense', group: 'Direct Costs', isSystem: true },
      { code: '5410', name: 'Depreciation Expense', type: 'expense', group: 'Operating Expenses', isSystem: true },
    ];

    await Account.insertMany(
      standardCOA.map((acc) => ({
        ...acc,
        organizationId: orgObjectId,
        openingBalance: mongoose.Types.Decimal128.fromString('0.00'),
        currentBalance: mongoose.Types.Decimal128.fromString('0.00'),
        currency: 'NPR',
        isActive: true,
      }))
    );
  }

  // Helper to generate sequential Journal Voucher number
  private async getNextJournalNumber(
    orgId: string,
    firmId: string,
    financialYearId: string,
    session: mongoose.ClientSession
  ): Promise<string> {
    const seq = await DocumentSequence.findOneAndUpdate(
      {
        organizationId: new mongoose.Types.ObjectId(orgId),
        firmId: new mongoose.Types.ObjectId(firmId),
        financialYearId: new mongoose.Types.ObjectId(financialYearId),
        type: 'journal_entry',
      },
      {
        $setOnInsert: { prefix: 'JV' },
        $inc: { nextNumber: 1 },
      },
      { upsert: true, new: true, session }
    );

    const pad = String(seq.nextNumber).padStart(4, '0');
    return `${seq.prefix}-${pad}`;
  }

  // 2. Account Master CRUD
  public async getAccounts(orgId: string) {
    await this.seedStandardChartOfAccounts(orgId);
    return Account.find({ organizationId: new mongoose.Types.ObjectId(orgId) }).sort({ code: 1 });
  }

  public async createAccount(orgId: string, dto: CreateAccountDTO, userId: string, ip?: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const existing = await Account.findOne({ organizationId: orgObjectId, code: dto.code });
    if (existing) {
      throw new AppError(409, 'ACCOUNT_CODE_EXISTS', `Account code ${dto.code} already exists`);
    }

    const opBal = dto.openingBalance ? mongoose.Types.Decimal128.fromString(dto.openingBalance) : mongoose.Types.Decimal128.fromString('0.00');

    const account = await Account.create({
      organizationId: orgObjectId,
      code: dto.code,
      name: dto.name,
      type: dto.type,
      group: dto.group,
      parentAccountId: dto.parentAccountId ? new mongoose.Types.ObjectId(dto.parentAccountId) : null,
      isSystem: false,
      openingBalance: opBal,
      currentBalance: opBal,
      currency: dto.currency || 'NPR',
      isActive: true,
    });

    await AuditLog.create({
      organizationId: orgObjectId,
      userId: new mongoose.Types.ObjectId(userId),
      action: 'account_created',
      entityType: 'account',
      entityId: account._id,
      referenceDocument: account.code,
      ipAddress: ip,
      newValue: { code: account.code, name: account.name, type: account.type },
    });

    return account;
  }

  // 3. Journal Entry Creation with Approval State Machine
  public async createJournalEntry(
    orgId: string,
    dto: CreateJournalEntryDTO,
    userId: string,
    ip?: string
  ): Promise<IJournalEntry> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const firmObjectId = new mongoose.Types.ObjectId(dto.firmId);
    const fyObjectId = new mongoose.Types.ObjectId(dto.financialYearId);

    // Period lock check
    const fiscalPeriod = await FiscalPeriod.findById(fyObjectId);
    if (fiscalPeriod && fiscalPeriod.isClosed) {
      throw new AppError(400, 'PERIOD_LOCKED', 'Cannot post voucher into a closed accounting fiscal period');
    }

    // Verify mathematical double-entry balance
    let totalDebit = 0;
    let totalCredit = 0;
    const formattedLines: any[] = [];

    for (const line of dto.lines) {
      const d = parseFloat(line.debit || '0');
      const c = parseFloat(line.credit || '0');
      totalDebit += d;
      totalCredit += c;

      const acc = await Account.findOne({ _id: new mongoose.Types.ObjectId(line.accountId), organizationId: orgObjectId });
      if (!acc) throw new AppError(404, 'ACCOUNT_NOT_FOUND', `Account ${line.accountId} not found`);

      const rate = parseFloat(dto.exchangeRate || '1.000000');
      formattedLines.push({
        accountId: acc._id,
        accountCode: acc.code,
        accountName: acc.name,
        partyId: line.partyId ? new mongoose.Types.ObjectId(line.partyId) : null,
        debit: mongoose.Types.Decimal128.fromString(d.toFixed(2)),
        credit: mongoose.Types.Decimal128.fromString(c.toFixed(2)),
        baseDebit: mongoose.Types.Decimal128.fromString((d * rate).toFixed(2)),
        baseCredit: mongoose.Types.Decimal128.fromString((c * rate).toFixed(2)),
        narration: line.narration,
      });
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError(
        422,
        'UNBALANCED_JOURNAL_VOUCHER',
        `Double-entry imbalance: Total Debits (NPR ${totalDebit.toFixed(2)}) must equal Total Credits (NPR ${totalCredit.toFixed(2)})`
      );
    }

    // Check organization approval policy
    const org = await Organization.findById(orgObjectId);
    const requiresApproval = org?.settings?.requireJournalApproval || false;
    let targetStatus: any = dto.status || 'posted';
    if (requiresApproval && targetStatus === 'posted') {
      targetStatus = 'submitted';
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const entryNumber = await this.getNextJournalNumber(orgId, dto.firmId, dto.financialYearId, session);

      const [journal] = await JournalEntry.create(
        [
          {
            organizationId: orgObjectId,
            firmId: firmObjectId,
            financialYearId: fyObjectId,
            entryNumber,
            date: dto.date ? new Date(dto.date) : new Date(),
            bsDate: dto.bsDate,
            narration: dto.narration,
            status: targetStatus,
            sourceModule: dto.sourceModule || 'manual',
            sourceDocumentId: dto.sourceDocumentId ? new mongoose.Types.ObjectId(dto.sourceDocumentId) : null,
            sourceDocumentNumber: dto.sourceDocumentNumber,
            currency: dto.currency || 'NPR',
            exchangeRate: mongoose.Types.Decimal128.fromString(dto.exchangeRate || '1.000000'),
            lines: formattedLines,
            totalDebit: mongoose.Types.Decimal128.fromString(totalDebit.toFixed(2)),
            totalCredit: mongoose.Types.Decimal128.fromString(totalCredit.toFixed(2)),
            attachments: dto.attachments || [],
            approval:
              targetStatus === 'submitted'
                ? { submittedBy: new mongoose.Types.ObjectId(userId), submittedAt: new Date() }
                : undefined,
            createdBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      // If posted directly, update running account balances
      if (targetStatus === 'posted') {
        await this.applyLedgerBalances(formattedLines, session);
      }

      await AuditLog.create(
        [
          {
            organizationId: orgObjectId,
            userId: new mongoose.Types.ObjectId(userId),
            action: `voucher_${targetStatus}`,
            entityType: 'journal_entry',
            entityId: journal._id,
            referenceDocument: journal.entryNumber,
            ipAddress: ip,
            newValue: { entryNumber: journal.entryNumber, totalDebit, status: targetStatus },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return journal;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // Apply ledger impact to accounts
  private async applyLedgerBalances(lines: any[], session: mongoose.ClientSession) {
    for (const line of lines) {
      const debit = parseFloat(line.debit.toString());
      const credit = parseFloat(line.credit.toString());
      const netChange = debit - credit;

      await Account.findByIdAndUpdate(
        line.accountId,
        {
          $inc: { currentBalance: mongoose.Types.Decimal128.fromString(netChange.toFixed(2)) },
        },
        { session }
      );
    }
  }

  // 4. Approval Workflow Handlers
  public async submitJournal(orgId: string, id: string, userId: string) {
    const journal = await JournalEntry.findOne({ _id: id, organizationId: new mongoose.Types.ObjectId(orgId) });
    if (!journal) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
    if (journal.status !== 'draft' && journal.status !== 'rejected') {
      throw new AppError(400, 'INVALID_STATUS', `Cannot submit voucher in ${journal.status} status`);
    }

    journal.status = 'submitted';
    journal.approval = { ...journal.approval, submittedBy: new mongoose.Types.ObjectId(userId), submittedAt: new Date() };
    await journal.save();
    return journal;
  }

  public async approveJournal(orgId: string, id: string, userId: string) {
    const journal = await JournalEntry.findOne({ _id: id, organizationId: new mongoose.Types.ObjectId(orgId) });
    if (!journal) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
    if (journal.status !== 'submitted') {
      throw new AppError(400, 'NOT_SUBMITTED', 'Only submitted vouchers can be approved');
    }

    journal.status = 'approved';
    journal.approval = { ...journal.approval, approvedBy: new mongoose.Types.ObjectId(userId), approvedAt: new Date() };
    await journal.save();
    return journal;
  }

  public async postJournal(orgId: string, id: string, _userId: string) {
    const journal = await JournalEntry.findOne({ _id: id, organizationId: new mongoose.Types.ObjectId(orgId) });
    if (!journal) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
    if (journal.status === 'posted') throw new AppError(400, 'ALREADY_POSTED', 'Journal voucher is already posted');
    if (journal.status !== 'approved' && journal.status !== 'draft') {
      throw new AppError(400, 'NOT_READY_TO_POST', `Cannot post voucher in ${journal.status} status`);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      journal.status = 'posted';
      await journal.save({ session });
      await this.applyLedgerBalances(journal.lines, session);
      await session.commitTransaction();
      return journal;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  public async rejectJournal(orgId: string, id: string, reason: string, userId: string) {
    const journal = await JournalEntry.findOne({ _id: id, organizationId: new mongoose.Types.ObjectId(orgId) });
    if (!journal) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
    if (journal.status !== 'submitted') {
      throw new AppError(400, 'NOT_SUBMITTED', 'Only submitted vouchers can be rejected');
    }

    journal.status = 'rejected';
    journal.approval = {
      ...journal.approval,
      rejectedBy: new mongoose.Types.ObjectId(userId),
      rejectedAt: new Date(),
      rejectionReason: reason,
    };
    await journal.save();
    return journal;
  }

  // 5. Reversal Workflow (Strict Immutability)
  public async reverseJournalEntry(orgId: string, id: string, reason: string, userId: string): Promise<IJournalEntry> {
    const original = await JournalEntry.findOne({ _id: id, organizationId: new mongoose.Types.ObjectId(orgId) });
    if (!original) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
    if (original.status !== 'posted') {
      throw new AppError(400, 'ONLY_POSTED_CAN_BE_REVERSED', 'Only posted journal entries can be reversed');
    }
    if (original.reversedBy) {
      throw new AppError(400, 'ALREADY_REVERSED', 'This journal entry has already been reversed');
    }

    // Build inverted lines
    const invertedLines = original.lines.map((l) => ({
      accountId: l.accountId,
      accountCode: l.accountCode,
      accountName: l.accountName,
      partyId: l.partyId,
      debit: l.credit,
      credit: l.debit,
      baseDebit: l.baseCredit,
      baseCredit: l.baseDebit,
      narration: `Reversal of ${original.entryNumber}: ${reason}`,
    }));

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const entryNumber = await this.getNextJournalNumber(
        orgId,
        original.firmId.toString(),
        original.financialYearId.toString(),
        session
      );

      const [reversal] = await JournalEntry.create(
        [
          {
            organizationId: original.organizationId,
            firmId: original.firmId,
            financialYearId: original.financialYearId,
            entryNumber,
            date: new Date(),
            bsDate: original.bsDate,
            narration: `Reversing Entry for ${original.entryNumber}. Reason: ${reason}`,
            status: 'posted',
            sourceModule: original.sourceModule,
            sourceDocumentId: original.sourceDocumentId,
            sourceDocumentNumber: original.sourceDocumentNumber,
            currency: original.currency,
            exchangeRate: original.exchangeRate,
            lines: invertedLines,
            totalDebit: original.totalCredit,
            totalCredit: original.totalDebit,
            reversalOf: original._id,
            reversalReason: reason,
            createdBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      original.status = 'reversed';
      original.reversedBy = reversal._id;
      original.reversalReason = reason;
      await original.save({ session });

      // Apply inverted ledger impact
      await this.applyLedgerBalances(invertedLines, session);

      await AuditLog.create(
        [
          {
            organizationId: original.organizationId,
            userId: new mongoose.Types.ObjectId(userId),
            action: 'voucher_reversed',
            entityType: 'journal_entry',
            entityId: original._id,
            referenceDocument: original.entryNumber,
            newValue: { reversalEntryNumber: reversal.entryNumber, reason },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return reversal;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // 6. Bulk Opening Balance Ingestion
  public async setOpeningBalances(orgId: string, dto: BulkOpeningBalanceDTO, userId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    for (const entry of dto.entries) {
      const amt = parseFloat(entry.openingBalance || '0');
      await Account.findOneAndUpdate(
        { _id: entry.accountId, organizationId: orgObjectId },
        {
          openingBalance: mongoose.Types.Decimal128.fromString(amt.toFixed(2)),
          currentBalance: mongoose.Types.Decimal128.fromString(amt.toFixed(2)),
        }
      );
    }

    await AuditLog.create({
      organizationId: orgObjectId,
      userId: new mongoose.Types.ObjectId(userId),
      action: 'opening_balances_updated',
      entityType: 'account',
      entityId: orgObjectId,
      newValue: { count: dto.entries.length },
    });

    return { success: true, updatedCount: dto.entries.length };
  }

  // 7. General Ledger & Account Statement
  public async getAccountLedger(orgId: string, accountId: string, query: any): Promise<AccountLedgerResponse> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const accObjectId = new mongoose.Types.ObjectId(accountId);

    const account = await Account.findOne({ _id: accObjectId, organizationId: orgObjectId });
    if (!account) throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');

    const filter: any = {
      organizationId: orgObjectId,
      status: { $in: ['posted', 'reversed'] },
      'lines.accountId': accObjectId,
    };

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const vouchers = await JournalEntry.find(filter).sort({ date: 1, createdAt: 1 });

    const opening = parseFloat(account.openingBalance.toString());
    let running = opening;
    const items = [];

    for (const v of vouchers) {
      const line = v.lines.find((l) => l.accountId.toString() === accountId);
      if (line) {
        const d = parseFloat(line.debit.toString());
        const c = parseFloat(line.credit.toString());
        running += d - c;
        items.push({
          date: v.date,
          bsDate: v.bsDate,
          entryNumber: v.entryNumber,
          narration: line.narration || v.narration,
          sourceModule: v.sourceModule,
          sourceDocumentNumber: v.sourceDocumentNumber,
          debit: d,
          credit: c,
          runningBalance: Number(running.toFixed(2)),
        });
      }
    }

    return {
      account: {
        _id: account._id.toString(),
        code: account.code,
        name: account.name,
        type: account.type,
        group: account.group,
      },
      openingBalance: opening,
      closingBalance: Number(running.toFixed(2)),
      items,
    };
  }

  // 8. Day Book
  public async getDayBook(orgId: string, dateStr?: string): Promise<DayBookItem[]> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const start = dateStr ? new Date(dateStr) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const vouchers = await JournalEntry.find({
      organizationId: orgObjectId,
      date: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    return vouchers.map((v) => ({
      entryNumber: v.entryNumber,
      time: v.date.toLocaleTimeString(),
      narration: v.narration,
      sourceModule: v.sourceModule,
      sourceDocumentNumber: v.sourceDocumentNumber,
      status: v.status,
      totalAmount: parseFloat(v.totalDebit.toString()),
      lines: v.lines.map((l) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: parseFloat(l.debit.toString()),
        credit: parseFloat(l.credit.toString()),
      })),
    }));
  }

  // 9. Trial Balance
  public async getTrialBalance(orgId: string): Promise<TrialBalanceResponse> {
    const accounts = await this.getAccounts(orgId);
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      const bal = parseFloat(acc.currentBalance.toString());
      let debit = 0;
      let credit = 0;

      if (['asset', 'expense'].includes(acc.type)) {
        if (bal >= 0) debit = bal;
        else credit = Math.abs(bal);
      } else {
        if (bal >= 0) credit = bal;
        else debit = Math.abs(bal);
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        accountId: acc._id.toString(),
        code: acc.code,
        name: acc.name,
        type: acc.type,
        group: acc.group,
        debit: Number(debit.toFixed(2)),
        credit: Number(credit.toFixed(2)),
      };
    });

    return {
      rows,
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.05,
    };
  }

  // 10. Profit & Loss Statement
  public async getProfitLoss(orgId: string): Promise<ProfitLossStatement> {
    const accounts = await this.getAccounts(orgId);
    const incomeGroups: Record<string, any[]> = {};
    const expenseGroups: Record<string, any[]> = {};

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const acc of accounts) {
      const bal = Math.abs(parseFloat(acc.currentBalance.toString()));
      if (acc.type === 'income') {
        totalIncome += bal;
        if (!incomeGroups[acc.group]) incomeGroups[acc.group] = [];
        incomeGroups[acc.group].push({ code: acc.code, name: acc.name, amount: bal });
      } else if (acc.type === 'expense') {
        totalExpenses += bal;
        if (!expenseGroups[acc.group]) expenseGroups[acc.group] = [];
        expenseGroups[acc.group].push({ code: acc.code, name: acc.name, amount: bal });
      }
    }

    const income = Object.entries(incomeGroups).map(([group, accs]) => ({
      group,
      accounts: accs,
      subtotal: accs.reduce((acc, curr) => acc + curr.amount, 0),
    }));

    const expenses = Object.entries(expenseGroups).map(([group, accs]) => ({
      group,
      accounts: accs,
      subtotal: accs.reduce((acc, curr) => acc + curr.amount, 0),
    }));

    return {
      income,
      expenses,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number((totalIncome - totalExpenses).toFixed(2)),
    };
  }

  // 11. Balance Sheet
  public async getBalanceSheet(orgId: string): Promise<BalanceSheetStatement> {
    const accounts = await this.getAccounts(orgId);
    const assetGroups: Record<string, any[]> = {};
    const liabilityGroups: Record<string, any[]> = {};
    const equityGroups: Record<string, any[]> = {};

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const acc of accounts) {
      const bal = parseFloat(acc.currentBalance.toString());
      if (acc.type === 'asset') {
        const val = Math.max(0, bal);
        totalAssets += val;
        if (!assetGroups[acc.group]) assetGroups[acc.group] = [];
        assetGroups[acc.group].push({ code: acc.code, name: acc.name, amount: val });
      } else if (acc.type === 'liability') {
        const val = Math.max(0, bal);
        totalLiabilities += val;
        if (!liabilityGroups[acc.group]) liabilityGroups[acc.group] = [];
        liabilityGroups[acc.group].push({ code: acc.code, name: acc.name, amount: val });
      } else if (acc.type === 'equity') {
        const val = Math.max(0, bal);
        totalEquity += val;
        if (!equityGroups[acc.group]) equityGroups[acc.group] = [];
        equityGroups[acc.group].push({ code: acc.code, name: acc.name, amount: val });
      }
    }

    // Add Net Profit to Retained Earnings
    const pnl = await this.getProfitLoss(orgId);
    totalEquity += pnl.netProfit;
    if (!equityGroups['Retained Earnings']) equityGroups['Retained Earnings'] = [];
    equityGroups['Retained Earnings'].push({
      code: '3200-CURR',
      name: 'Current Year Net Profit / (Loss)',
      amount: pnl.netProfit,
    });

    const assets = Object.entries(assetGroups).map(([group, accs]) => ({
      group,
      accounts: accs,
      subtotal: accs.reduce((acc, curr) => acc + curr.amount, 0),
    }));

    const liabilities = Object.entries(liabilityGroups).map(([group, accs]) => ({
      group,
      accounts: accs,
      subtotal: accs.reduce((acc, curr) => acc + curr.amount, 0),
    }));

    const equity = Object.entries(equityGroups).map(([group, accs]) => ({
      group,
      accounts: accs,
      subtotal: accs.reduce((acc, curr) => acc + curr.amount, 0),
    }));

    return {
      assets,
      liabilities,
      equity,
      totalAssets: Number(totalAssets.toFixed(2)),
      totalLiabilities: Number(totalLiabilities.toFixed(2)),
      totalEquity: Number(totalEquity.toFixed(2)),
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1.0,
    };
  }

  // 12. Cash Flow Statement
  public async getCashFlowStatement(orgId: string): Promise<CashFlowStatement> {
    const pnl = await this.getProfitLoss(orgId);
    const cashAcc = await Account.findOne({ organizationId: new mongoose.Types.ObjectId(orgId), code: '1110' });
    const bankAcc = await Account.findOne({ organizationId: new mongoose.Types.ObjectId(orgId), code: '1120' });

    const openCash =
      parseFloat(cashAcc?.openingBalance.toString() || '0') + parseFloat(bankAcc?.openingBalance.toString() || '0');
    const closeCash =
      parseFloat(cashAcc?.currentBalance.toString() || '0') + parseFloat(bankAcc?.currentBalance.toString() || '0');

    return {
      operatingActivities: [
        { title: 'Net Profit from Operations', amount: pnl.netProfit },
        { title: 'Depreciation Non-Cash Adjustment', amount: 0 },
      ],
      investingActivities: [{ title: 'Purchase of Fixed Assets & Equipment', amount: 0 }],
      financingActivities: [{ title: 'Capital Injection & Equity Movements', amount: 0 }],
      netCashFlow: Number((closeCash - openCash).toFixed(2)),
      openingCash: Number(openCash.toFixed(2)),
      closingCash: Number(closeCash.toFixed(2)),
    };
  }

  // 13. Tax Summary Report
  public async getTaxSummaryReport(orgId: string): Promise<TaxSummaryReport> {
    const outputVat = await Account.findOne({ organizationId: new mongoose.Types.ObjectId(orgId), code: '2120' });
    const inputVat = await Account.findOne({ organizationId: new mongoose.Types.ObjectId(orgId), code: '1150' });
    const tds = await Account.findOne({ organizationId: new mongoose.Types.ObjectId(orgId), code: '2130' });

    const outAmt = Math.abs(parseFloat(outputVat?.currentBalance.toString() || '0'));
    const inAmt = Math.abs(parseFloat(inputVat?.currentBalance.toString() || '0'));
    const tdsAmt = Math.abs(parseFloat(tds?.currentBalance.toString() || '0'));

    const taxableSales = outAmt > 0 ? (outAmt / 13) * 100 : 0;
    const taxablePurchases = inAmt > 0 ? (inAmt / 13) * 100 : 0;

    return {
      taxableSales: Number(taxableSales.toFixed(2)),
      exemptSales: 0,
      outputVatCollected: Number(outAmt.toFixed(2)),
      taxablePurchases: Number(taxablePurchases.toFixed(2)),
      exemptPurchases: 0,
      inputVatClaimable: Number(inAmt.toFixed(2)),
      netVatPayable: Number((outAmt - inAmt).toFixed(2)),
      tdsWithheldPayable: Number(tdsAmt.toFixed(2)),
    };
  }

  // 14. List Journal Vouchers
  public async getJournals(orgId: string, query: any) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const filter: any = { organizationId: orgObjectId };

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { entryNumber: { $regex: query.search, $options: 'i' } },
        { narration: { $regex: query.search, $options: 'i' } },
        { sourceDocumentNumber: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '15', 10);
    const skip = (page - 1) * limit;

    const [items, totalRecords] = await Promise.all([
      JournalEntry.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      JournalEntry.countDocuments(filter),
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
}

export const accountingService = new AccountingService();
