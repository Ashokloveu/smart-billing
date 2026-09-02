import { Request, Response, NextFunction } from 'express';
import { transactionService } from './transaction.service.js';

export class TransactionController {
  // Create
  public async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.createTransaction(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Cancel / Reverse
  public async cancelTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.cancelTransaction(
        req.params.orgId,
        req.params.id,
        req.body.reason,
        req.user!.id
      );
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Payment
  public async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.recordPayment(req.params.orgId, req.params.id, req.body.amount);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // List
  public async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.getTransactions(req.params.orgId, req.query as any);
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

  // Get Detail
  public async getTransactionById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.getTransactionById(req.params.orgId, req.params.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }
}

export const transactionController = new TransactionController();
