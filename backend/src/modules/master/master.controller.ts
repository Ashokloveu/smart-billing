import { Request, Response, NextFunction } from 'express';
import { masterService } from './master.service.js';

export class MasterController {
  // Organizations
  public async createOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.createOrganization(req.user!.id, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getUserOrganizations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getUserOrganizations(req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getOrganization(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Firms
  public async createFirm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.createFirm(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getFirms(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getFirms(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Fiscal Periods
  public async createFiscalPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.createFiscalPeriod(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getFiscalPeriods(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getFiscalPeriods(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Parties
  public async createParty(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.createParty(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getParties(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getParties(req.params.orgId, req.query as any);
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

  // Categories & Units
  public async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.createCategory(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getCategories(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async createUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.createUnit(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getUnits(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getUnits(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Tax Policies
  public async createTaxPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.createTaxPolicy(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getTaxPolicies(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getTaxPolicies(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Items
  public async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.createItem(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getItems(req.params.orgId, req.query as any);
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

  // Roles
  public async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterService.getRoles(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }
}

export const masterController = new MasterController();
