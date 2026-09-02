import { Request, Response, NextFunction } from 'express';
import { operationsService } from './operations.service.js';

export class OperationsController {
  // Transfers
  public async getTransfers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.getStockTransfers(req.params.orgId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.createStockTransfer(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async dispatchTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.dispatchStockTransfer(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async receiveTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.receiveStockTransfer(req.params.orgId, req.params.id, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Batches
  public async getBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.getStockBatches(req.params.orgId, req.query);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.createStockBatch(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // PR
  public async getRequisitions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.getPurchaseRequisitions(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createRequisition(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.createPurchaseRequisition(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // PO
  public async getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.getPurchaseOrders(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.createPurchaseOrder(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // GRN
  public async getGoodsReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.getGoodsReceipts(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createGoodsReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.createGoodsReceipt(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Sales Orders
  public async getSalesOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.getSalesOrders(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  public async createSalesOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.createSalesOrder(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Stock Adjustment
  public async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.adjustStock(req.params.orgId, req.body, req.user!.id);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }

  // Universal Approvals
  public async approveDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.approveDocument(
        req.params.orgId,
        req.params.docType,
        req.params.id,
        req.user!.id
      );
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data });
    } catch (e) {
      next(e);
    }
  }
}

export const operationsController = new OperationsController();
