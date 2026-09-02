import mongoose from 'mongoose';
import { Warehouse, IWarehouse } from '../../models/Warehouse.js';
import { StockMovement, IStockMovement } from '../../models/StockMovement.js';
import { StockBalance } from '../../models/StockBalance.js';
import { Item } from '../../models/Item.js';
import { Organization } from '../../models/Organization.js';
import { BadRequestError, ConflictError } from '../../errors/AppError.js';

export interface InventoryQuery {
  page?: number;
  limit?: number;
  warehouseId?: string;
  search?: string;
  lowStockOnly?: boolean;
}

export class InventoryService {
  // Warehouses
  public async createWarehouse(orgId: string, data: any): Promise<IWarehouse> {
    const existing = await Warehouse.findOne({
      organizationId: orgId,
      code: data.code.toUpperCase(),
    });
    if (existing) throw new ConflictError('Warehouse code already exists');

    if (data.isDefault) {
      await Warehouse.updateMany({ organizationId: orgId }, { isDefault: false });
    }

    return Warehouse.create({
      ...data,
      organizationId: orgId,
      code: data.code.toUpperCase(),
    });
  }

  public async getWarehouses(orgId: string): Promise<IWarehouse[]> {
    return Warehouse.find({ organizationId: orgId, isActive: true }).populate('firmId', 'name code');
  }

  // Record Inbound Movement & Update WAC
  private async applyInbound(
    orgId: string,
    warehouseId: string,
    itemId: string,
    quantity: number,
    costRate: number,
    type: 'opening' | 'purchase' | 'adjustment' | 'transfer_in',
    remarks: string,
    userId?: string
  ): Promise<IStockMovement> {
    const totalCost = quantity * costRate;

    // Fetch existing balance
    let balance = await StockBalance.findOne({ organizationId: orgId, warehouseId, itemId });

    if (!balance) {
      balance = new StockBalance({
        organizationId: new mongoose.Types.ObjectId(orgId),
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        itemId: new mongoose.Types.ObjectId(itemId),
        quantity: mongoose.Types.Decimal128.fromString('0.00'),
        averageCost: mongoose.Types.Decimal128.fromString('0.00'),
        totalValuation: mongoose.Types.Decimal128.fromString('0.00'),
      });
    }

    const currentQty = Number(balance.quantity.toString());
    const currentCost = Number(balance.averageCost.toString());

    // Calculate new WAC
    const newQty = currentQty + quantity;
    const newTotalVal = (currentQty * currentCost) + totalCost;
    const newAvgCost = newQty > 0 ? newTotalVal / newQty : costRate;

    balance.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
    balance.averageCost = mongoose.Types.Decimal128.fromString(newAvgCost.toFixed(4));
    balance.totalValuation = mongoose.Types.Decimal128.fromString(newTotalVal.toFixed(2));
    balance.lastMovementDate = new Date();
    await balance.save();

    // Create append-only movement
    return StockMovement.create({
      organizationId: orgId,
      warehouseId,
      itemId,
      type,
      direction: 'IN',
      quantity: mongoose.Types.Decimal128.fromString(quantity.toFixed(4)),
      costRate: mongoose.Types.Decimal128.fromString(costRate.toFixed(4)),
      totalCost: mongoose.Types.Decimal128.fromString(totalCost.toFixed(2)),
      remarks,
      createdBy: userId,
      date: new Date(),
    });
  }

  // Record Outbound Movement & Negative Stock Enforcement
  private async applyOutbound(
    orgId: string,
    warehouseId: string,
    itemId: string,
    quantity: number,
    type: 'sale' | 'purchase_return' | 'adjustment' | 'transfer_out',
    remarks: string,
    userId?: string
  ): Promise<IStockMovement> {
    const org = await Organization.findById(orgId);
    const allowNegative = org?.settings?.allowNegativeStock ?? false;

    let balance = await StockBalance.findOne({ organizationId: orgId, warehouseId, itemId });
    const currentQty = balance ? Number(balance.quantity.toString()) : 0;
    const currentAvgCost = balance ? Number(balance.averageCost.toString()) : 0;

    if (!allowNegative && currentQty < quantity) {
      throw new BadRequestError(
        `Insufficient stock for item. Available: ${currentQty.toFixed(2)}, Requested: ${quantity.toFixed(2)}`
      );
    }

    const newQty = currentQty - quantity;
    const totalOutCost = quantity * currentAvgCost;
    const newTotalVal = Math.max(0, newQty * currentAvgCost);

    if (!balance) {
      balance = new StockBalance({
        organizationId: new mongoose.Types.ObjectId(orgId),
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        itemId: new mongoose.Types.ObjectId(itemId),
        averageCost: mongoose.Types.Decimal128.fromString(currentAvgCost.toFixed(4)),
      });
    }

    balance.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
    balance.totalValuation = mongoose.Types.Decimal128.fromString(newTotalVal.toFixed(2));
    balance.lastMovementDate = new Date();
    await balance.save();

    return StockMovement.create({
      organizationId: orgId,
      warehouseId,
      itemId,
      type,
      direction: 'OUT',
      quantity: mongoose.Types.Decimal128.fromString(quantity.toFixed(4)),
      costRate: mongoose.Types.Decimal128.fromString(currentAvgCost.toFixed(4)),
      totalCost: mongoose.Types.Decimal128.fromString(totalOutCost.toFixed(2)),
      remarks,
      createdBy: userId,
      date: new Date(),
    });
  }

  // Ingest Opening Stock
  public async recordOpeningStock(orgId: string, data: any, userId: string) {
    const { warehouseId, items } = data;
    const createdMovements = [];

    for (const entry of items) {
      const qty = Number(entry.quantity);
      const cost = Number(entry.costRate);
      const mov = await this.applyInbound(
        orgId,
        warehouseId,
        entry.itemId,
        qty,
        cost,
        'opening',
        'Opening Stock Balance Ingestion',
        userId
      );
      createdMovements.push(mov);
    }

    return createdMovements;
  }

  // Stock Adjustment (Damage / Loss / Physical Correction)
  public async recordStockAdjustment(orgId: string, data: any, userId: string) {
    const { warehouseId, itemId, action, quantity, unitCost, reason, remarks } = data;
    const qty = Number(quantity);
    const cost = Number(unitCost || 0);

    if (action === 'add') {
      return this.applyInbound(
        orgId,
        warehouseId,
        itemId,
        qty,
        cost,
        'adjustment',
        `Adjustment [${reason}]: ${remarks}`,
        userId
      );
    } else {
      return this.applyOutbound(
        orgId,
        warehouseId,
        itemId,
        qty,
        'adjustment',
        `Adjustment [${reason}]: ${remarks}`,
        userId
      );
    }
  }

  // Inter-Warehouse Transfer
  public async transferStock(orgId: string, data: any, userId: string) {
    const { sourceWarehouseId, targetWarehouseId, items, remarks } = data;

    if (sourceWarehouseId === targetWarehouseId) {
      throw new BadRequestError('Source and target warehouse must be different');
    }

    const results = [];
    for (const entry of items) {
      const qty = Number(entry.quantity);

      // Debit Source
      const outMov = await this.applyOutbound(
        orgId,
        sourceWarehouseId,
        entry.itemId,
        qty,
        'transfer_out',
        `Transfer to target store: ${remarks || ''}`,
        userId
      );

      const transferCost = Number(outMov.costRate.toString());

      // Credit Target
      const inMov = await this.applyInbound(
        orgId,
        targetWarehouseId,
        entry.itemId,
        qty,
        transferCost,
        'transfer_in',
        `Transfer from source store: ${remarks || ''}`,
        userId
      );

      results.push({ outMov, inMov });
    }

    return results;
  }

  // Live Inventory Positions & Balances
  public async getInventoryPositions(orgId: string, query: InventoryQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (query.warehouseId && query.warehouseId !== 'all') {
      filter.warehouseId = new mongoose.Types.ObjectId(query.warehouseId);
    }

    const [balances, totalRecords] = await Promise.all([
      StockBalance.find(filter)
        .populate('itemId', 'name code barcode minimumStock primaryUnitId salePrice')
        .populate('warehouseId', 'name code')
        .sort({ lastMovementDate: -1 })
        .skip(skip)
        .limit(limit),
      StockBalance.countDocuments(filter),
    ]);

    return {
      items: balances,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  // Item Stock Subledger
  public async getItemStockLedger(orgId: string, itemId: string, warehouseId?: string) {
    const filter: any = { organizationId: orgId, itemId };
    if (warehouseId && warehouseId !== 'all') {
      filter.warehouseId = warehouseId;
    }

    return StockMovement.find(filter)
      .populate('warehouseId', 'name code')
      .sort({ date: 1, createdAt: 1 });
  }

  // Stock Valuation Summary
  public async getValuationReport(orgId: string) {
    const balances = await StockBalance.find({ organizationId: orgId })
      .populate('itemId', 'name code categoryId')
      .populate('warehouseId', 'name code');

    let totalValuation = 0;
    let totalItemsTracked = 0;

    for (const b of balances) {
      totalValuation += Number(b.totalValuation?.toString() || 0);
      totalItemsTracked += 1;
    }

    return {
      totalValuation: totalValuation.toFixed(2),
      totalPositions: totalItemsTracked,
      breakdown: balances,
    };
  }

  // Low Stock Items
  public async getLowStockReport(orgId: string) {
    const items = await Item.find({ organizationId: orgId, isStockTracked: true });
    const lowStockList = [];

    for (const item of items) {
      const minStock = Number(item.minimumStock?.toString() || 0);
      const totalStockAgg = await StockBalance.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(orgId), itemId: item._id } },
        { $group: { _id: null, totalQty: { $sum: '$quantity' } } },
      ]);

      const currentTotal = totalStockAgg.length > 0 ? Number(totalStockAgg[0].totalQty.toString()) : 0;

      if (currentTotal <= minStock) {
        lowStockList.push({
          item,
          currentQuantity: currentTotal,
          minimumStock: minStock,
          deficit: minStock - currentTotal,
        });
      }
    }

    return lowStockList;
  }
}

export const inventoryService = new InventoryService();
