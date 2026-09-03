import { Request, Response, NextFunction } from 'express';
import { crmService } from '../services/crm.service.js';

export class CrmController {
  // Duplicates
  public async checkDuplicates(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.checkDuplicates(req.params.orgId, req.query as any);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Leads
  public async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.getLeads(req.params.orgId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.createLead(req.params.orgId, req.body, req.user!.id, req.ip);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async convertLead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.convertLeadToCustomer(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Customer 360
  public async getCustomer360(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.getCustomer360(req.params.orgId, req.params.customerId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Quotations
  public async getQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.getQuotations(req.params.orgId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.createQuotation(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async convertQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.convertQuotationToSalesOrder(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Opportunities
  public async getOpportunities(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.getOpportunities(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createOpportunity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.createOpportunity(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async updateOpportunityStage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.updateOpportunityStage(
        req.params.orgId,
        req.params.id,
        req.body.stage,
        req.user!.id
      );
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Activities & Targets
  public async recordActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.recordActivity(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async getSalesTargets(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.getSalesTargets(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createSalesTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await crmService.createSalesTarget(req.params.orgId, req.body, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }
}

export const crmController = new CrmController();
