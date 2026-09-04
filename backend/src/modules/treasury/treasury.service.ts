import mongoose from 'mongoose';
import { Account } from '../../models/Account.js';
import { AuditLog } from '../../models/AuditLog.js';
import { BankReconciliation } from '../../models/BankReconciliation.js';
import { Firm } from '../../models/Firm.js';
import { FiscalPeriod } from '../../models/FiscalPeriod.js';
import { FundTransfer } from '../../models/FundTransfer.js';
import { JournalEntry } from '../../models/JournalEntry.js';
import { ChequeStatus, PostDatedCheque } from '../../models/PostDatedCheque.js';
import { TreasuryAccount } from '../../models/TreasuryAccount.js';
import { AppError } from '../../errors/AppError.js';
import { accountingService } from '../accounting/accounting.service.js';

const decimal = (value: string | number) => mongoose.Types.Decimal128.fromString(Number(value).toFixed(2));

export class TreasuryService {
  async getAccounts(orgId: string) {
    return TreasuryAccount.find({ organizationId: orgId, isActive: true })
      .populate('ledgerAccountId', 'code currentBalance currency')
      .sort({ type: 1, name: 1 });
  }

  async createAccount(orgId: string, data: any, userId: string, ip?: string) {
    const code = `TR-${data.type.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-8)}`;
    const ledger = await accountingService.createAccount(orgId, {
      code,
      name: data.name,
      type: 'asset',
      group: data.type === 'cash' ? 'Cash in Hand' : 'Bank and Cash Equivalents',
      openingBalance: data.openingBalance,
      currency: 'NPR',
    }, userId, ip);

    try {
      return await TreasuryAccount.create({
        organizationId: orgId,
        ledgerAccountId: ledger._id,
        name: data.name,
        type: data.type,
        accountNumber: data.accountNumber || undefined,
        bankName: data.bankName || undefined,
        branch: data.branch || undefined,
        color: data.color,
        createdBy: userId,
      });
    } catch (error) {
      await Account.deleteOne({ _id: ledger._id, organizationId: orgId });
      throw error;
    }
  }

  async getTransfers(orgId: string) {
    return FundTransfer.find({ organizationId: orgId })
      .populate('fromAccountId', 'name type')
      .populate('toAccountId', 'name type')
      .sort({ date: -1 })
      .limit(100);
  }

  async createTransfer(orgId: string, data: any, userId: string, ip?: string) {
    const [from, to, firm, period] = await Promise.all([
      TreasuryAccount.findOne({ _id: data.fromAccountId, organizationId: orgId, isActive: true }).populate('ledgerAccountId'),
      TreasuryAccount.findOne({ _id: data.toAccountId, organizationId: orgId, isActive: true }).populate('ledgerAccountId'),
      Firm.findOne({ organizationId: orgId, isHeadOffice: true, isActive: true }),
      FiscalPeriod.findOne({ organizationId: orgId, isCurrent: true, isClosed: false }),
    ]);
    if (!from || !to) throw new AppError(404, 'TREASURY_ACCOUNT_NOT_FOUND', 'Treasury account not found');
    if (!firm) throw new AppError(409, 'FIRM_REQUIRED', 'Create an active head-office firm before transferring funds');
    if (!period) throw new AppError(409, 'FISCAL_PERIOD_REQUIRED', 'Create an open current fiscal period before transferring funds');

    const fromLedger = from.ledgerAccountId as any;
    const toLedger = to.ledgerAccountId as any;
    const amount = Number(data.amount);
    if (Number(fromLedger.currentBalance.toString()) < amount) {
      throw new AppError(422, 'INSUFFICIENT_FUNDS', `Insufficient balance in ${from.name}`);
    }

    const transferNumber = `TXF-${Date.now().toString(36).toUpperCase()}`;
    const journal = await accountingService.createJournalEntry(orgId, {
      firmId: firm._id.toString(),
      financialYearId: period._id.toString(),
      date: data.date,
      bsDate: data.bsDate,
      narration: data.narration,
      status: 'posted',
      sourceModule: 'treasury',
      sourceDocumentNumber: transferNumber,
      lines: [
        { accountId: toLedger._id.toString(), debit: amount.toFixed(2), credit: '0.00', narration: data.narration },
        { accountId: fromLedger._id.toString(), debit: '0.00', credit: amount.toFixed(2), narration: data.narration },
      ],
    }, userId, ip);

    return FundTransfer.create({
      organizationId: orgId,
      transferNumber,
      fromAccountId: from._id,
      toAccountId: to._id,
      amount: decimal(amount),
      date: data.date ? new Date(data.date) : new Date(),
      bsDate: data.bsDate,
      narration: data.narration,
      journalEntryId: journal._id,
      createdBy: userId,
    });
  }

  async getCheques(orgId: string, status?: string) {
    const filter: Record<string, unknown> = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (status && status !== 'all') filter.status = status;
    return PostDatedCheque.find(filter).sort({ chequeDate: 1, createdAt: -1 }).limit(250);
  }

  async createCheque(orgId: string, data: any, userId: string) {
    return PostDatedCheque.create({
      organizationId: orgId,
      chequeNumber: data.chequeNumber.toUpperCase(),
      amount: decimal(data.amount),
      chequeDate: new Date(data.chequeDate),
      partyName: data.partyName,
      bankName: data.bankName,
      type: data.type,
      status: 'pending',
      remarks: data.remarks,
      statusHistory: [{ status: 'pending', changedAt: new Date(), changedBy: userId }],
      createdBy: userId,
    });
  }

  async updateChequeStatus(orgId: string, chequeId: string, status: ChequeStatus, userId: string) {
    const cheque = await PostDatedCheque.findOne({ _id: chequeId, organizationId: orgId });
    if (!cheque) throw new AppError(404, 'CHEQUE_NOT_FOUND', 'Cheque not found');
    const allowed: Record<ChequeStatus, ChequeStatus[]> = {
      pending: ['deposited', 'cleared', 'bounced', 'cancelled'],
      deposited: ['cleared', 'bounced', 'cancelled'],
      cleared: [],
      bounced: ['pending', 'cancelled'],
      cancelled: [],
    };
    if (status !== cheque.status && !allowed[cheque.status].includes(status)) {
      throw new AppError(409, 'INVALID_CHEQUE_TRANSITION', `Cannot change cheque from ${cheque.status} to ${status}`);
    }
    if (status !== cheque.status) {
      cheque.status = status;
      cheque.statusHistory.push({ status, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(userId) });
      await cheque.save();
    }
    return cheque;
  }

  async getLedger(orgId: string, treasuryAccountId: string) {
    const treasury = await TreasuryAccount.findOne({ _id: treasuryAccountId, organizationId: orgId }).populate('ledgerAccountId');
    if (!treasury) throw new AppError(404, 'TREASURY_ACCOUNT_NOT_FOUND', 'Treasury account not found');
    const ledger = treasury.ledgerAccountId as any;
    const [journals, reconciliations] = await Promise.all([
      JournalEntry.find({ organizationId: orgId, status: 'posted', 'lines.accountId': ledger._id }).sort({ date: -1 }).limit(200),
      BankReconciliation.find({ organizationId: orgId, treasuryAccountId: treasury._id }),
    ]);
    const reconciled = new Set(reconciliations.map((item) => item.journalEntryId.toString()));
    let runningBalance = Number(ledger.currentBalance.toString());
    return journals.map((journal) => {
      const line = journal.lines.find((entry) => entry.accountId.toString() === ledger._id.toString())!;
      const row = {
        id: journal._id,
        date: journal.date,
        description: journal.narration,
        debit: line.debit,
        credit: line.credit,
        balance: decimal(runningBalance),
        ref: journal.sourceDocumentNumber || journal.entryNumber,
        reconciled: reconciled.has(journal._id.toString()),
      };
      runningBalance = runningBalance - Number(line.debit.toString()) + Number(line.credit.toString());
      return row;
    });
  }

  async setReconciled(orgId: string, treasuryAccountId: string, journalId: string, reconciled: boolean, userId: string) {
    const [treasury, journal] = await Promise.all([
      TreasuryAccount.findOne({ _id: treasuryAccountId, organizationId: orgId }),
      JournalEntry.findOne({ _id: journalId, organizationId: orgId, status: 'posted' }),
    ]);
    if (!treasury || !journal) throw new AppError(404, 'RECONCILIATION_ITEM_NOT_FOUND', 'Account or journal entry not found');
    const belongsToAccount = journal.lines.some((line) => line.accountId.toString() === treasury.ledgerAccountId.toString());
    if (!belongsToAccount) throw new AppError(422, 'JOURNAL_ACCOUNT_MISMATCH', 'Journal entry does not belong to this account');

    if (reconciled) {
      await BankReconciliation.findOneAndUpdate(
        { organizationId: orgId, treasuryAccountId, journalEntryId: journalId },
        { reconciledAt: new Date(), reconciledBy: userId },
        { upsert: true, new: true }
      );
    } else {
      await BankReconciliation.deleteOne({ organizationId: orgId, treasuryAccountId, journalEntryId: journalId });
    }
    await AuditLog.create({ organizationId: orgId, userId, action: reconciled ? 'bank_reconciled' : 'bank_unreconciled', entityType: 'journal_entry', entityId: journalId });
    return { reconciled };
  }
}

export const treasuryService = new TreasuryService();
