import { Request, Response, NextFunction } from 'express';
import { complianceService } from './compliance.service.js';

export class ComplianceController {
  // Annex 5 Sales Register (Bikri Khata)
  public async getSalesRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await complianceService.getVatSalesRegister(req.params.orgId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Annex 7/8 Purchase Register (Kharid Khata)
  public async getPurchaseRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await complianceService.getVatPurchaseRegister(req.params.orgId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Invoice Compliance & QR verification
  public async verifyInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await complianceService.verifyInvoiceCompliance(req.params.orgId, req.params.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Numbering Sequences
  public async getSequences(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await complianceService.getSequences(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async upsertSequence(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await complianceService.upsertSequence(req.params.orgId, req.body, req.user!.id, req.ip);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Fiscal Year Closing & Period Locking
  public async closeFiscalPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await complianceService.closeFiscalPeriod(
        req.params.orgId,
        req.params.id,
        req.body.reason,
        req.user!.id,
        req.ip
      );
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Audit Logs
  public async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await complianceService.getAuditLogs(req.params.orgId, req.query);
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
}

export const complianceController = new ComplianceController();
