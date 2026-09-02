import mongoose from 'mongoose';
import { Transaction, ITransaction, ITransactionLine } from '../../models/Transaction.js';
import { DocumentSequence } from '../../models/DocumentSequence.js';
import { Item } from '../../models/Item.js';
import { Party } from '../../models/Party.js';
import { StockMovement } from '../../models/StockMovement.js';
import { StockBalance } from '../../models/StockBalance.js';
import { Organization } from '../../models/Organization.js';
import { Account } from '../../models/Account.js';
import { JournalEntry } from '../../models/JournalEntry.js';
import { BadRequestError, NotFoundError } from '../../errors/AppError.js';

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  partyId?: string;
}

export class TransactionService {
  // Generate Atomic Document Numbers
  private async getNextDocumentNumber(
    orgId: string,
    firmId: string,
    financialYearId: string,
    type: string
  ): Promise<string> {
    const prefixes: Record<string, string> = {
      sale_invoice: 'INV',
      pos_invoice: 'POS',
      purchase_bill: 'BILL',
      sales_return: 'SRTN',
      purchase_return: 'PRTN',
    };

    const prefix = prefixes[type] || 'DOC';

    const seq = await DocumentSequence.findOneAndUpdate(
      {
        organizationId: new mongoose.Types.ObjectId(orgId),
        firmId: new mongoose.Types.ObjectId(firmId),
        financialYearId: new mongoose.Types.ObjectId(financialYearId),
        type,
      },
      {
        $inc: { nextNumber: 1 },
        $setOnInsert: { prefix },
      },
      { upsert: true, new: true }
    );

    const padNumber = String(seq.nextNumber).padStart(4, '0');
    return `${prefix}-${padNumber}`;
  }

  // Create Transaction (Sales / Purchase / POS / Returns)
  public async createTransaction(orgId: string, data: any, userId: string): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const org = await Organization.findById(orgId).session(session);
      const allowNegative = org?.settings?.allowNegativeStock ?? false;

      // 1. Process Line Calculations
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTaxable = 0;
      let totalTax = 0;

      const processedLines: ITransactionLine[] = [];

      for (const line of data.lines) {
        const item = await Item.findById(line.itemId).session(session);
        if (!item) throw new NotFoundError(`Item ${line.itemId} not found`);

        const qty = Number(line.quantity);
        const rate = Number(line.rate);
        const disc = Number(line.discountAmount || 0);
        const gross = qty * rate;
        const taxable = Math.max(0, gross - disc);
        const taxRate = Number(line.taxRate || 13);
        const taxAmt = (taxable * taxRate) / 100;
        const lineTot = taxable + taxAmt;

        subtotal += gross;
        totalDiscount += disc;
        totalTaxable += taxable;
        totalTax += taxAmt;

        processedLines.push({
          itemId: item._id,
          itemName: item.name,
          itemCode: item.code,
          quantity: mongoose.Types.Decimal128.fromString(qty.toFixed(4)),
          rate: mongoose.Types.Decimal128.fromString(rate.toFixed(4)),
          grossAmount: mongoose.Types.Decimal128.fromString(gross.toFixed(2)),
          discountAmount: mongoose.Types.Decimal128.fromString(disc.toFixed(2)),
          taxableAmount: mongoose.Types.Decimal128.fromString(taxable.toFixed(2)),
          taxRate: mongoose.Types.Decimal128.fromString(taxRate.toFixed(2)),
          taxAmount: mongoose.Types.Decimal128.fromString(taxAmt.toFixed(2)),
          lineTotal: mongoose.Types.Decimal128.fromString(lineTot.toFixed(2)),
        });
      }

      const grandTotal = totalTaxable + totalTax;
      const paid = Number(data.paidAmount || 0);
      const balanceDue = Math.max(0, grandTotal - paid);

      // 2. Generate Document Number
      const documentNumber = await this.getNextDocumentNumber(
        orgId,
        data.firmId,
        data.financialYearId,
        data.type
      );

      // 3. Create Transaction Record
      const txn = new Transaction({
        ...data,
        organizationId: orgId,
        documentNumber,
        lines: processedLines,
        subtotal: mongoose.Types.Decimal128.fromString(subtotal.toFixed(2)),
        totalDiscount: mongoose.Types.Decimal128.fromString(totalDiscount.toFixed(2)),
        totalTaxableAmount: mongoose.Types.Decimal128.fromString(totalTaxable.toFixed(2)),
        totalTax: mongoose.Types.Decimal128.fromString(totalTax.toFixed(2)),
        grandTotal: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
        paidAmount: mongoose.Types.Decimal128.fromString(paid.toFixed(2)),
        balanceDue: mongoose.Types.Decimal128.fromString(balanceDue.toFixed(2)),
        createdBy: userId,
      });

      await txn.save({ session });

      // 4. If status is 'posted', execute stock and counterparty impacts
      if (data.status === 'posted') {
        await this.processInventoryAndPartyImpact(
          orgId,
          txn,
          processedLines,
          data.warehouseId,
          allowNegative,
          userId,
          session
        );
      }

      await session.commitTransaction();
      return txn;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // Stock Movement & Party Ledger Updater
  private async processInventoryAndPartyImpact(
    orgId: string,
    txn: ITransaction,
    lines: ITransactionLine[],
    warehouseId: string,
    allowNegative: boolean,
    userId: string,
    session: mongoose.ClientSession
  ) {
    const isSale = txn.type === 'sale_invoice' || txn.type === 'pos_invoice' || txn.type === 'purchase_return';
    const isInbound = txn.type === 'purchase_bill' || txn.type === 'sales_return';

    for (const line of lines) {
      const qty = Number(line.quantity.toString());
      const rate = Number(line.rate.toString());

      let balance = await StockBalance.findOne({
        organizationId: orgId,
        warehouseId,
        itemId: line.itemId,
      }).session(session);

      if (!balance) {
        balance = new StockBalance({
          organizationId: new mongoose.Types.ObjectId(orgId),
          warehouseId: new mongoose.Types.ObjectId(warehouseId),
          itemId: line.itemId,
          quantity: mongoose.Types.Decimal128.fromString('0.00'),
          averageCost: mongoose.Types.Decimal128.fromString('0.00'),
          totalValuation: mongoose.Types.Decimal128.fromString('0.00'),
        });
      }

      const currentQty = Number(balance.quantity.toString());
      const currentAvgCost = Number(balance.averageCost.toString());

      if (isSale) {
        // Outbound reduction
        if (!allowNegative && currentQty < qty) {
          throw new BadRequestError(
            `Insufficient stock for item "${line.itemName}". Available: ${currentQty}, Requested: ${qty}`
          );
        }

        const newQty = currentQty - qty;
        const totalCostOut = qty * currentAvgCost;
        const newTotalVal = Math.max(0, newQty * currentAvgCost);

        balance.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
        balance.totalValuation = mongoose.Types.Decimal128.fromString(newTotalVal.toFixed(2));
        balance.lastMovementDate = new Date();
        await balance.save({ session });

        await StockMovement.create(
          [
            {
              organizationId: orgId,
              warehouseId,
              itemId: line.itemId,
              transactionId: txn._id,
              documentNumber: txn.documentNumber,
              type: txn.type === 'purchase_return' ? 'purchase_return' : 'sale',
              direction: 'OUT',
              quantity: line.quantity,
              costRate: mongoose.Types.Decimal128.fromString(currentAvgCost.toFixed(4)),
              totalCost: mongoose.Types.Decimal128.fromString(totalCostOut.toFixed(2)),
              remarks: `${txn.type.toUpperCase()}: ${txn.documentNumber}`,
              createdBy: userId,
              date: txn.date,
              bsDate: txn.bsDate,
            },
          ],
          { session }
        );
      } else if (isInbound) {
        // Inbound addition with WAC recalculation
        const newQty = currentQty + qty;
        const totalInCost = qty * rate;
        const newTotalVal = (currentQty * currentAvgCost) + totalInCost;
        const newAvgCost = newQty > 0 ? newTotalVal / newQty : rate;

        balance.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
        balance.averageCost = mongoose.Types.Decimal128.fromString(newAvgCost.toFixed(4));
        balance.totalValuation = mongoose.Types.Decimal128.fromString(newTotalVal.toFixed(2));
        balance.lastMovementDate = new Date();
        await balance.save({ session });

        await StockMovement.create(
          [
            {
              organizationId: orgId,
              warehouseId,
              itemId: line.itemId,
              transactionId: txn._id,
              documentNumber: txn.documentNumber,
              type: txn.type === 'sales_return' ? 'sale_return' : 'purchase',
              direction: 'IN',
              quantity: line.quantity,
              costRate: line.rate,
              totalCost: mongoose.Types.Decimal128.fromString(totalInCost.toFixed(2)),
              remarks: `${txn.type.toUpperCase()}: ${txn.documentNumber}`,
              createdBy: userId,
              date: txn.date,
              bsDate: txn.bsDate,
            },
          ],
          { session }
        );
      }
    }

    // Update Party Outstanding Balance
    if (txn.partyId) {
      const party = await Party.findById(txn.partyId).session(session);
      if (party) {
        const curBal = Number(party.currentBalance?.toString() || 0);
        const due = Number(txn.balanceDue.toString());

        // For sales invoices: increases customer debt (+)
        // For purchase bills: increases supplier payable (+)
        // For returns: decreases balance (-)
        let newBal = curBal;
        if (txn.type === 'sale_invoice' || txn.type === 'pos_invoice' || txn.type === 'purchase_bill') {
          newBal += due;
        } else if (txn.type === 'sales_return' || txn.type === 'purchase_return') {
          newBal -= due;
        }

        party.currentBalance = mongoose.Types.Decimal128.fromString(newBal.toFixed(2));
        await party.save({ session });
      }
    }

    // Auto-generate Double-Entry Accounting Journal Entry (Phase 6 Integration)
    await this.generateTransactionJournal(orgId, txn, userId, session);
  }

  // Double-Entry Journal Entry Generator for Transactions
  private async generateTransactionJournal(
    orgId: string,
    txn: any,
    userId: string,
    session: mongoose.ClientSession
  ) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const firmObjectId = new mongoose.Types.ObjectId(txn.firmId);
    const fyObjectId = new mongoose.Types.ObjectId(txn.financialYearId);

    // Fetch Standard Accounts
    const [cashAcc, arAcc, apAcc, stockAcc, salesAcc, purchAcc, outVatAcc, inVatAcc] = await Promise.all([
      Account.findOne({ organizationId: orgObjectId, code: '1110' }).session(session),
      Account.findOne({ organizationId: orgObjectId, code: '1130' }).session(session),
      Account.findOne({ organizationId: orgObjectId, code: '2110' }).session(session),
      Account.findOne({ organizationId: orgObjectId, code: '1140' }).session(session),
      Account.findOne({ organizationId: orgObjectId, code: '4100' }).session(session),
      Account.findOne({ organizationId: orgObjectId, code: '5100' }).session(session),
      Account.findOne({ organizationId: orgObjectId, code: '2120' }).session(session),
      Account.findOne({ organizationId: orgObjectId, code: '1150' }).session(session),
    ]);

    if (!salesAcc || !purchAcc || !cashAcc) return; // COA not yet seeded

    const grandTotal = Number(txn.grandTotal.toString());
    const taxable = Number(txn.totalTaxableAmount.toString());
    const tax = Number(txn.totalTax.toString());
    const lines: any[] = [];

    if (txn.type === 'sale_invoice' || txn.type === 'pos_invoice') {
      const debitAcc = txn.paymentMode === 'cash' ? cashAcc : arAcc || cashAcc;
      lines.push({
        accountId: debitAcc._id,
        accountCode: debitAcc.code,
        accountName: debitAcc.name,
        partyId: txn.partyId || null,
        debit: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
        credit: mongoose.Types.Decimal128.fromString('0.00'),
        baseDebit: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
        baseCredit: mongoose.Types.Decimal128.fromString('0.00'),
        narration: `Receivable/Cash for ${txn.documentNumber}`,
      });

      lines.push({
        accountId: salesAcc._id,
        accountCode: salesAcc.code,
        accountName: salesAcc.name,
        partyId: null,
        debit: mongoose.Types.Decimal128.fromString('0.00'),
        credit: mongoose.Types.Decimal128.fromString(taxable.toFixed(2)),
        baseDebit: mongoose.Types.Decimal128.fromString('0.00'),
        baseCredit: mongoose.Types.Decimal128.fromString(taxable.toFixed(2)),
        narration: `Sales Revenue for ${txn.documentNumber}`,
      });

      if (tax > 0 && outVatAcc) {
        lines.push({
          accountId: outVatAcc._id,
          accountCode: outVatAcc.code,
          accountName: outVatAcc.name,
          partyId: null,
          debit: mongoose.Types.Decimal128.fromString('0.00'),
          credit: mongoose.Types.Decimal128.fromString(tax.toFixed(2)),
          baseDebit: mongoose.Types.Decimal128.fromString('0.00'),
          baseCredit: mongoose.Types.Decimal128.fromString(tax.toFixed(2)),
          narration: `13% Output VAT on ${txn.documentNumber}`,
        });
      }
    } else if (txn.type === 'purchase_bill') {
      const creditAcc = txn.paymentMode === 'cash' ? cashAcc : apAcc || cashAcc;
      const debitAcc = stockAcc || purchAcc;

      lines.push({
        accountId: debitAcc._id,
        accountCode: debitAcc.code,
        accountName: debitAcc.name,
        partyId: null,
        debit: mongoose.Types.Decimal128.fromString(taxable.toFixed(2)),
        credit: mongoose.Types.Decimal128.fromString('0.00'),
        baseDebit: mongoose.Types.Decimal128.fromString(taxable.toFixed(2)),
        baseCredit: mongoose.Types.Decimal128.fromString('0.00'),
        narration: `Stock Inbound / Purchases for ${txn.documentNumber}`,
      });

      if (tax > 0 && inVatAcc) {
        lines.push({
          accountId: inVatAcc._id,
          accountCode: inVatAcc.code,
          accountName: inVatAcc.name,
          partyId: null,
          debit: mongoose.Types.Decimal128.fromString(tax.toFixed(2)),
          credit: mongoose.Types.Decimal128.fromString('0.00'),
          baseDebit: mongoose.Types.Decimal128.fromString(tax.toFixed(2)),
          baseCredit: mongoose.Types.Decimal128.fromString('0.00'),
          narration: `Input VAT claimable on ${txn.documentNumber}`,
        });
      }

      lines.push({
        accountId: creditAcc._id,
        accountCode: creditAcc.code,
        accountName: creditAcc.name,
        partyId: txn.partyId || null,
        debit: mongoose.Types.Decimal128.fromString('0.00'),
        credit: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
        baseDebit: mongoose.Types.Decimal128.fromString('0.00'),
        baseCredit: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
        narration: `Payable/Cash for ${txn.documentNumber}`,
      });
    }

    if (lines.length >= 2) {
      // Find or assign sequential JV number
      const seq = await DocumentSequence.findOneAndUpdate(
        {
          organizationId: orgObjectId,
          firmId: firmObjectId,
          financialYearId: fyObjectId,
          type: 'journal_entry',
        },
        { $setOnInsert: { prefix: 'JV' }, $inc: { nextNumber: 1 } },
        { upsert: true, new: true, session }
      );
      const entryNumber = `${seq.prefix}-${String(seq.nextNumber).padStart(4, '0')}`;

      await JournalEntry.create(
        [
          {
            organizationId: orgObjectId,
            firmId: firmObjectId,
            financialYearId: fyObjectId,
            entryNumber,
            date: txn.date,
            bsDate: txn.bsDate,
            narration: `Auto Journal for ${txn.type.toUpperCase()} #${txn.documentNumber}`,
            status: 'posted',
            sourceModule: txn.type.startsWith('sale') ? 'sales' : txn.type === 'pos_invoice' ? 'pos' : 'purchase',
            sourceDocumentId: txn._id,
            sourceDocumentNumber: txn.documentNumber,
            lines,
            totalDebit: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
            totalCredit: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
            createdBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      // Apply ledger impact
      for (const line of lines) {
        const d = parseFloat(line.debit.toString());
        const c = parseFloat(line.credit.toString());
        await Account.findByIdAndUpdate(line.accountId, {
          $inc: { currentBalance: mongoose.Types.Decimal128.fromString((d - c).toFixed(2)) },
        }).session(session);
      }
    }
  }

  // Cancel / Reverse Posted Transaction
  public async cancelTransaction(orgId: string, txnId: string, reason: string, userId: string): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const txn = await Transaction.findOne({ _id: txnId, organizationId: orgId }).session(session);
      if (!txn) throw new NotFoundError('Transaction not found');
      if (txn.status === 'cancelled') throw new BadRequestError('Transaction is already cancelled');

      // If document was posted, perform reversal of stock movements and party balances
      if (txn.status === 'posted') {
        const isSale = txn.type === 'sale_invoice' || txn.type === 'pos_invoice';

        for (const line of txn.lines) {
          const qty = Number(line.quantity.toString());
          const balance = await StockBalance.findOne({
            organizationId: orgId,
            warehouseId: txn.warehouseId,
            itemId: line.itemId,
          }).session(session);

          if (balance) {
            const currentQty = Number(balance.quantity.toString());
            const currentCost = Number(balance.averageCost.toString());

            // Reverse sale -> add back to stock
            // Reverse purchase -> take out from stock
            const newQty = isSale ? currentQty + qty : Math.max(0, currentQty - qty);
            const newTotalVal = newQty * currentCost;

            balance.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
            balance.totalValuation = mongoose.Types.Decimal128.fromString(newTotalVal.toFixed(2));
            await balance.save({ session });
          }

          // Write reversal stock movement
          await StockMovement.create(
            [
              {
                organizationId: orgId,
                warehouseId: txn.warehouseId,
                itemId: line.itemId,
                transactionId: txn._id,
                documentNumber: `REV-${txn.documentNumber}`,
                type: 'adjustment',
                direction: isSale ? 'IN' : 'OUT',
                quantity: line.quantity,
                costRate: line.rate,
                totalCost: line.lineTotal,
                remarks: `Cancellation Reversal: ${reason}`,
                createdBy: userId,
                date: new Date(),
                bsDate: txn.bsDate,
              },
            ],
            { session }
          );
        }

        // Reverse Party Balance
        if (txn.partyId) {
          const party = await Party.findById(txn.partyId).session(session);
          if (party) {
            const curBal = Number(party.currentBalance?.toString() || 0);
            const due = Number(txn.balanceDue.toString());
            const newBal = curBal - due;
            party.currentBalance = mongoose.Types.Decimal128.fromString(newBal.toFixed(2));
            await party.save({ session });
          }
        }
      }

      txn.status = 'cancelled';
      txn.cancellationReason = reason;
      txn.cancelledAt = new Date();
      await txn.save({ session });

      await session.commitTransaction();
      return txn;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // Record Payment towards an Invoice/Bill
  public async recordPayment(orgId: string, txnId: string, amount: string): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const txn = await Transaction.findOne({ _id: txnId, organizationId: orgId }).session(session);
      if (!txn) throw new NotFoundError('Transaction not found');
      if (txn.status !== 'posted') throw new BadRequestError('Payments can only be recorded on posted transactions');

      const payAmount = Number(amount);
      const currentPaid = Number(txn.paidAmount.toString());
      const currentDue = Number(txn.balanceDue.toString());

      if (payAmount > currentDue) {
        throw new BadRequestError(`Payment amount (NPR ${payAmount}) exceeds balance due (NPR ${currentDue})`);
      }

      const newPaid = currentPaid + payAmount;
      const newDue = currentDue - payAmount;

      txn.paidAmount = mongoose.Types.Decimal128.fromString(newPaid.toFixed(2));
      txn.balanceDue = mongoose.Types.Decimal128.fromString(newDue.toFixed(2));
      await txn.save({ session });

      // Update Party balance
      if (txn.partyId) {
        const party = await Party.findById(txn.partyId).session(session);
        if (party) {
          const curBal = Number(party.currentBalance?.toString() || 0);
          party.currentBalance = mongoose.Types.Decimal128.fromString((curBal - payAmount).toFixed(2));
          await party.save({ session });
        }
      }

      await session.commitTransaction();
      return txn;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // List Transactions
  public async getTransactions(orgId: string, query: TransactionQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (query.type && query.type !== 'all') filter.type = query.type;
    if (query.status && query.status !== 'all') filter.status = query.status;
    if (query.partyId) filter.partyId = new mongoose.Types.ObjectId(query.partyId);

    if (query.search) {
      filter.$or = [
        { documentNumber: { $regex: query.search, $options: 'i' } },
        { partyName: { $regex: query.search, $options: 'i' } },
        { partyPan: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, totalRecords] = await Promise.all([
      Transaction.find(filter)
        .populate('firmId', 'name code')
        .populate('warehouseId', 'name code')
        .populate('partyId', 'name phone')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
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

  // Get Single Transaction Detail
  public async getTransactionById(orgId: string, id: string): Promise<ITransaction> {
    const txn = await Transaction.findOne({ _id: id, organizationId: orgId })
      .populate('firmId', 'name code address phone')
      .populate('warehouseId', 'name code')
      .populate('partyId', 'name phone panNumber billingAddress');

    if (!txn) throw new NotFoundError('Transaction document not found');
    return txn;
  }
}

export const transactionService = new TransactionService();
