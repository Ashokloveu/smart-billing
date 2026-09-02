import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';

export class InventoryController {
  // Warehouses
  public async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.createWarehouse(req.params.orgId, req.body);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getWarehouses(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Opening Stock
  public async recordOpeningStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.recordOpeningStock(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Stock Adjustment
  public async recordStockAdjustment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.recordStockAdjustment(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Inter-Warehouse Transfer
  public async transferStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.transferStock(req.params.orgId, req.body, req.user!.id);
      res.status(201).json({ success: true, statusCode: 201, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Balances
  public async getInventoryPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getInventoryPositions(req.params.orgId, req.query as any);
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

  // Stock Ledger
  public async getItemStockLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getItemStockLedger(
        req.params.orgId,
        req.params.itemId,
        req.query.warehouseId as string
      );
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  // Reports
  public async getValuationReport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getValuationReport(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }

  public async getLowStockReport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getLowStockReport(req.params.orgId);
      res.status(200).json({ success: true, statusCode: 200, correlationId: req.correlationId, data: result });
    } catch (e) {
      next(e);
    }
  }
}

export const inventoryController = new InventoryController();
