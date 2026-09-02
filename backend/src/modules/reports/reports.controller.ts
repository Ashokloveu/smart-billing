import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';

export class ReportsController {
  // 1. Dashboard Summary
  public async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getDashboardSummary(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // 2. Sales Summary
  public async getSalesSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getSalesSummary(req.params.orgId, req.query as any);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // 3. Purchase Summary
  public async getPurchaseSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getPurchaseSummary(req.params.orgId, req.query as any);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // 4. Inventory Summary
  public async getInventorySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getInventorySummary(req.params.orgId, req.query as any);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // 5. Profit & Loss
  public async getProfitLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getProfitLoss(req.params.orgId, req.query as any);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // 6. Top Selling Items
  public async getTopSellingItems(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getTopSellingItems(req.params.orgId, req.query as any);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // 7. Outstanding Summary
  public async getOutstandingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getOutstandingSummary(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }
}

export const reportsController = new ReportsController();
