import { Request, Response, NextFunction } from 'express';
import { accountingService } from './accounting.service.js';

export class AccountingController {
  // Accounts
  public async getAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getAccounts(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.createAccount(req.params.orgId, req.body, req.user!.id, req.ip);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Journal Vouchers
  public async getJournals(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await accountingService.getJournals(req.params.orgId, req.query);
      res.status(200).json({
        success: true,
        statusCode: 200,
        correlationId: req.correlationId,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (e) {
      next(e);
    }
  }

  public async createJournalEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.createJournalEntry(req.params.orgId, req.body, req.user!.id, req.ip);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Approval Workflow
  public async submitJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.submitJournal(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async approveJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.approveJournal(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async postJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.postJournal(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async rejectJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.rejectJournal(req.params.orgId, req.params.id, req.body.reason, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async reverseJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.reverseJournalEntry(req.params.orgId, req.params.id, req.body.reason, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Opening Balances
  public async setOpeningBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.setOpeningBalances(req.params.orgId, req.body, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Ledgers & Reports
  public async getAccountLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getAccountLedger(req.params.orgId, req.params.accountId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async getDayBook(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getDayBook(req.params.orgId, req.query.date as string);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async getTrialBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getTrialBalance(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async getProfitLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getProfitLoss(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async getBalanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getBalanceSheet(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async getCashFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getCashFlowStatement(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async getTaxSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getTaxSummaryReport(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }
}

export const accountingController = new AccountingController();
