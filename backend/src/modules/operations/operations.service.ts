import mongoose from 'mongoose';
import { StockBatch, IStockBatch } from '../../models/StockBatch.js';
import { StockTransfer, IStockTransfer } from '../../models/StockTransfer.js';
import { PurchaseRequisition, IPurchaseRequisition } from '../../models/PurchaseRequisition.js';
import { PurchaseOrder, IPurchaseOrder } from '../../models/PurchaseOrder.js';
import { GoodsReceipt, IGoodsReceipt } from '../../models/GoodsReceipt.js';
import { SalesOrder, ISalesOrder } from '../../models/SalesOrder.js';
import { StockBalance } from '../../models/StockBalance.js';
import { StockMovement } from '../../models/StockMovement.js';
import { Item } from '../../models/Item.js';
import { Party } from '../../models/Party.js';
import { Account } from '../../models/Account.js';
import { JournalEntry } from '../../models/JournalEntry.js';
import { Notification } from '../../models/Notification.js';
import { AppError } from '../../errors/AppError.js';
import {
  StockTransferDTO,
  StockBatchDTO,
  PurchaseRequisitionDTO,
  PurchaseOrderDTO,
  GoodsReceiptDTO,
  SalesOrderDTO,
  StockAdjustmentDTO,
} from './operations.types.js';

export class OperationsService {
  // ==========================================
  // 1. Stock Transfers (Inter-Warehouse)
  // ==========================================
  public async getStockTransfers(orgId: string, query: any) {
    const filter: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (query.status) filter.status = query.status;

    return StockTransfer.find(filter)
      .populate('sourceWarehouseId', 'name code')
      .populate('destinationWarehouseId', 'name code')
      .populate('items.itemId', 'name code')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async createStockTransfer(
    orgId: string,
    dto: StockTransferDTO,
    userId: string
  ): Promise<IStockTransfer> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const sourceWh = new mongoose.Types.ObjectId(dto.sourceWarehouseId);
    const destWh = new mongoose.Types.ObjectId(dto.destinationWarehouseId);

    if (dto.sourceWarehouseId === dto.destinationWarehouseId) {
      throw new AppError(400, 'INVALID_DESTINATION', 'Source and destination warehouses cannot be the same');
    }

    const count = await StockTransfer.countDocuments({ organizationId: orgObjectId });
    const transferNumber = `ST-${String(count + 1).padStart(4, '0')}`;

    const items: any[] = [];
    for (const item of dto.items) {
      const itemDoc = await Item.findOne({ _id: new mongoose.Types.ObjectId(item.itemId), organizationId: orgObjectId });
      if (!itemDoc) throw new AppError(404, 'ITEM_NOT_FOUND', `Item ${item.itemId} not found`);

      const qty = parseFloat(item.quantity.toString());
      const cost = parseFloat(itemDoc.purchasePrice?.toString() || '0');

      items.push({
        itemId: itemDoc._id,
        quantity: mongoose.Types.Decimal128.fromString(qty.toFixed(4)),
        batchNumber: item.batchNumber,
        costRate: mongoose.Types.Decimal128.fromString(cost.toFixed(4)),
        totalCost: mongoose.Types.Decimal128.fromString((qty * cost).toFixed(2)),
      });
    }

    return StockTransfer.create({
      organizationId: orgObjectId,
      transferNumber,
      sourceWarehouseId: sourceWh,
      destinationWarehouseId: destWh,
      date: dto.date ? new Date(dto.date) : new Date(),
      bsDate: dto.bsDate,
      status: 'draft',
      items,
      notes: dto.notes,
      submittedBy: new mongoose.Types.ObjectId(userId),
    });
  }

  public async dispatchStockTransfer(orgId: string, transferId: string, userId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await StockTransfer.findOne({ _id: transferId, organizationId: orgObjectId }).session(session);
      if (!transfer) throw new AppError(404, 'NOT_FOUND', 'Transfer not found');
      if (transfer.status !== 'draft' && transfer.status !== 'approved') {
        throw new AppError(400, 'INVALID_STATUS', `Cannot dispatch transfer in ${transfer.status} status`);
      }

      // Decrement source warehouse stock
      for (const itm of transfer.items) {
        const qty = parseFloat(itm.quantity.toString());
        const bal = await StockBalance.findOne({
          organizationId: orgObjectId,
          warehouseId: transfer.sourceWarehouseId,
          itemId: itm.itemId,
        }).session(session);

        const currentQty = bal ? parseFloat(bal.quantity.toString()) : 0;
        if (currentQty < qty) {
          throw new AppError(400, 'INSUFFICIENT_STOCK', `Insufficient quantity in source warehouse for transfer`);
        }

        const newQty = currentQty - qty;
        bal!.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
        await bal!.save({ session });

        // Record OUT stock movement
        await StockMovement.create(
          [
            {
              organizationId: orgObjectId,
              warehouseId: transfer.sourceWarehouseId,
              itemId: itm.itemId,
              documentNumber: transfer.transferNumber,
              type: 'transfer_out',
              direction: 'OUT',
              quantity: itm.quantity,
              previousQuantity: mongoose.Types.Decimal128.fromString(currentQty.toFixed(4)),
              newQuantity: mongoose.Types.Decimal128.fromString(newQty.toFixed(4)),
              batchNumber: itm.batchNumber,
              costRate: itm.costRate,
              totalCost: itm.totalCost,
              date: new Date(),
              bsDate: transfer.bsDate,
              remarks: `Transfer OUT to Destination Warehouse`,
              createdBy: new mongoose.Types.ObjectId(userId),
            },
          ],
          { session }
        );
      }

      transfer.status = 'in_transit';
      transfer.dispatchedBy = new mongoose.Types.ObjectId(userId);
      transfer.dispatchedAt = new Date();
      await transfer.save({ session });

      await session.commitTransaction();
      return transfer;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  public async receiveStockTransfer(orgId: string, transferId: string, userId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await StockTransfer.findOne({ _id: transferId, organizationId: orgObjectId }).session(session);
      if (!transfer) throw new AppError(404, 'NOT_FOUND', 'Transfer not found');
      if (transfer.status !== 'in_transit') {
        throw new AppError(400, 'NOT_IN_TRANSIT', 'Only in-transit transfers can be received');
      }

      // Increment destination warehouse stock
      for (const itm of transfer.items) {
        const qty = parseFloat(itm.quantity.toString());
        let bal = await StockBalance.findOne({
          organizationId: orgObjectId,
          warehouseId: transfer.destinationWarehouseId,
          itemId: itm.itemId,
        }).session(session);

        const currentQty = bal ? parseFloat(bal.quantity.toString()) : 0;
        const newQty = currentQty + qty;

        if (!bal) {
          bal = new StockBalance({
            organizationId: orgObjectId,
            warehouseId: transfer.destinationWarehouseId,
            itemId: itm.itemId,
            quantity: mongoose.Types.Decimal128.fromString(newQty.toFixed(4)),
            averageCost: itm.costRate,
            totalValuation: itm.totalCost,
          });
        } else {
          bal.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
        }
        await bal.save({ session });

        // Record IN stock movement
        await StockMovement.create(
          [
            {
              organizationId: orgObjectId,
              warehouseId: transfer.destinationWarehouseId,
              itemId: itm.itemId,
              documentNumber: transfer.transferNumber,
              type: 'transfer_in',
              direction: 'IN',
              quantity: itm.quantity,
              previousQuantity: mongoose.Types.Decimal128.fromString(currentQty.toFixed(4)),
              newQuantity: mongoose.Types.Decimal128.fromString(newQty.toFixed(4)),
              batchNumber: itm.batchNumber,
              costRate: itm.costRate,
              totalCost: itm.totalCost,
              date: new Date(),
              bsDate: transfer.bsDate,
              remarks: `Transfer IN from Source Warehouse`,
              createdBy: new mongoose.Types.ObjectId(userId),
            },
          ],
          { session }
        );
      }

      transfer.status = 'received';
      transfer.receivedBy = new mongoose.Types.ObjectId(userId);
      transfer.receivedAt = new Date();
      await transfer.save({ session });

      await session.commitTransaction();
      return transfer;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ==========================================
  // 2. Stock Batches & Barcodes
  // ==========================================
  public async getStockBatches(orgId: string, query: any) {
    const filter: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (query.warehouseId) filter.warehouseId = new mongoose.Types.ObjectId(query.warehouseId);
    if (query.itemId) filter.itemId = new mongoose.Types.ObjectId(query.itemId);

    return StockBatch.find(filter)
      .populate('itemId', 'name code')
      .populate('warehouseId', 'name code')
      .sort({ expiryDate: 1 })
      .lean();
  }

  public async createStockBatch(orgId: string, dto: StockBatchDTO): Promise<IStockBatch> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    return StockBatch.create({
      organizationId: orgObjectId,
      firmId: new mongoose.Types.ObjectId(dto.warehouseId), // mapped
      warehouseId: new mongoose.Types.ObjectId(dto.warehouseId),
      itemId: new mongoose.Types.ObjectId(dto.itemId),
      batchNumber: dto.batchNumber.trim().toUpperCase(),
      manufacturingDate: dto.manufacturingDate ? new Date(dto.manufacturingDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      costPrice: mongoose.Types.Decimal128.fromString(parseFloat(dto.costPrice.toString()).toFixed(4)),
      salePrice: dto.salePrice ? mongoose.Types.Decimal128.fromString(parseFloat(dto.salePrice.toString()).toFixed(2)) : undefined,
      initialQuantity: mongoose.Types.Decimal128.fromString(parseFloat(dto.initialQuantity.toString()).toFixed(4)),
      currentQuantity: mongoose.Types.Decimal128.fromString(parseFloat(dto.initialQuantity.toString()).toFixed(4)),
      barcode: dto.barcode || dto.batchNumber,
      isActive: true,
    });
  }

  // ==========================================
  // 3. Purchase Requisitions & Orders
  // ==========================================
  public async getPurchaseRequisitions(orgId: string) {
    return PurchaseRequisition.find({ organizationId: new mongoose.Types.ObjectId(orgId) })
      .populate('requestedBy', 'fullName email')
      .populate('items.itemId', 'name code')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async createPurchaseRequisition(orgId: string, dto: PurchaseRequisitionDTO, userId: string): Promise<IPurchaseRequisition> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const count = await PurchaseRequisition.countDocuments({ organizationId: orgObjectId });
    const requisitionNumber = `PR-${String(count + 1).padStart(4, '0')}`;

    const items = dto.items.map((i) => ({
      itemId: new mongoose.Types.ObjectId(i.itemId),
      quantity: mongoose.Types.Decimal128.fromString(parseFloat(i.quantity.toString()).toFixed(4)),
      estimatedRate: mongoose.Types.Decimal128.fromString(parseFloat(i.estimatedRate.toString()).toFixed(2)),
      reason: i.reason,
    }));

    return PurchaseRequisition.create({
      organizationId: orgObjectId,
      requisitionNumber,
      department: dto.department,
      requestedBy: new mongoose.Types.ObjectId(userId),
      requiredByDate: new Date(dto.requiredByDate),
      status: 'draft',
      items,
    });
  }

  public async getPurchaseOrders(orgId: string) {
    return PurchaseOrder.find({ organizationId: new mongoose.Types.ObjectId(orgId) })
      .populate('supplierId', 'name panNumber phone')
      .populate('items.itemId', 'name code')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async createPurchaseOrder(orgId: string, dto: PurchaseOrderDTO, userId: string): Promise<IPurchaseOrder> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const supplier = await Party.findOne({ _id: new mongoose.Types.ObjectId(dto.supplierId), organizationId: orgObjectId });
    if (!supplier) throw new AppError(404, 'SUPPLIER_NOT_FOUND', 'Supplier not found');

    const count = await PurchaseOrder.countDocuments({ organizationId: orgObjectId });
    const poNumber = `PO-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let taxTotal = 0;
    const items: any[] = [];

    for (const itm of dto.items) {
      const itemDoc = await Item.findById(itm.itemId);
      const qty = parseFloat(itm.quantity.toString());
      const rate = parseFloat(itm.rate.toString());
      const taxable = qty * rate;
      const tax = taxable * 0.13;
      const total = taxable + tax;

      subtotal += taxable;
      taxTotal += tax;

      items.push({
        itemId: new mongoose.Types.ObjectId(itm.itemId),
        itemName: itemDoc?.name || 'Item',
        quantity: mongoose.Types.Decimal128.fromString(qty.toFixed(4)),
        receivedQuantity: mongoose.Types.Decimal128.fromString('0.00'),
        rate: mongoose.Types.Decimal128.fromString(rate.toFixed(2)),
        taxableAmount: mongoose.Types.Decimal128.fromString(taxable.toFixed(2)),
        taxRate: mongoose.Types.Decimal128.fromString('13.00'),
        taxAmount: mongoose.Types.Decimal128.fromString(tax.toFixed(2)),
        totalAmount: mongoose.Types.Decimal128.fromString(total.toFixed(2)),
      });
    }

    const grandTotal = subtotal + taxTotal;

    return PurchaseOrder.create({
      organizationId: orgObjectId,
      firmId: new mongoose.Types.ObjectId(dto.firmId),
      financialYearId: new mongoose.Types.ObjectId(dto.financialYearId),
      poNumber,
      supplierId: supplier._id,
      supplierName: supplier.name,
      supplierPan: supplier.panNumber,
      requisitionId: dto.requisitionId ? new mongoose.Types.ObjectId(dto.requisitionId) : undefined,
      orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
      expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      status: 'draft',
      items,
      subtotal: mongoose.Types.Decimal128.fromString(subtotal.toFixed(2)),
      taxTotal: mongoose.Types.Decimal128.fromString(taxTotal.toFixed(2)),
      grandTotal: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
      termsAndConditions: dto.termsAndConditions,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }

  // ==========================================
  // 4. Goods Receipt Notes (GRN)
  // ==========================================
  public async getGoodsReceipts(orgId: string) {
    return GoodsReceipt.find({ organizationId: new mongoose.Types.ObjectId(orgId) })
      .populate('supplierId', 'name panNumber')
      .populate('warehouseId', 'name code')
      .populate('items.itemId', 'name code')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async createGoodsReceipt(orgId: string, dto: GoodsReceiptDTO, userId: string): Promise<IGoodsReceipt> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const count = await GoodsReceipt.countDocuments({ organizationId: orgObjectId });
      const grnNumber = `GRN-${String(count + 1).padStart(4, '0')}`;

      const items: any[] = [];
      for (const itm of dto.items) {
        const oQty = parseFloat(itm.orderedQuantity.toString());
        const rQty = parseFloat(itm.receivedQuantity.toString());
        const aQty = parseFloat(itm.acceptedQuantity.toString());
        const rejQty = parseFloat(itm.rejectedQuantity?.toString() || '0');
        const cost = parseFloat(itm.unitCost.toString());
        const total = aQty * cost;

        items.push({
          itemId: new mongoose.Types.ObjectId(itm.itemId),
          orderedQuantity: mongoose.Types.Decimal128.fromString(oQty.toFixed(4)),
          receivedQuantity: mongoose.Types.Decimal128.fromString(rQty.toFixed(4)),
          acceptedQuantity: mongoose.Types.Decimal128.fromString(aQty.toFixed(4)),
          rejectedQuantity: mongoose.Types.Decimal128.fromString(rejQty.toFixed(4)),
          batchNumber: itm.batchNumber,
          expiryDate: itm.expiryDate ? new Date(itm.expiryDate) : undefined,
          unitCost: mongoose.Types.Decimal128.fromString(cost.toFixed(4)),
          totalCost: mongoose.Types.Decimal128.fromString(total.toFixed(2)),
        });

        // Inventory Stock Increment
        let bal = await StockBalance.findOne({
          organizationId: orgObjectId,
          warehouseId: new mongoose.Types.ObjectId(dto.warehouseId),
          itemId: new mongoose.Types.ObjectId(itm.itemId),
        }).session(session);

        const curQty = bal ? parseFloat(bal.quantity.toString()) : 0;
        const curAvg = bal ? parseFloat(bal.averageCost.toString()) : cost;
        const newQty = curQty + aQty;
        const newTotalVal = (curQty * curAvg) + total;
        const newAvg = newQty > 0 ? newTotalVal / newQty : cost;

        if (!bal) {
          bal = new StockBalance({
            organizationId: orgObjectId,
            warehouseId: new mongoose.Types.ObjectId(dto.warehouseId),
            itemId: new mongoose.Types.ObjectId(itm.itemId),
            quantity: mongoose.Types.Decimal128.fromString(newQty.toFixed(4)),
            averageCost: mongoose.Types.Decimal128.fromString(newAvg.toFixed(4)),
            totalValuation: mongoose.Types.Decimal128.fromString(newTotalVal.toFixed(2)),
          });
        } else {
          bal.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
          bal.averageCost = mongoose.Types.Decimal128.fromString(newAvg.toFixed(4));
          bal.totalValuation = mongoose.Types.Decimal128.fromString(newTotalVal.toFixed(2));
        }
        await bal.save({ session });

        // Record Movement
        await StockMovement.create(
          [
            {
              organizationId: orgObjectId,
              warehouseId: new mongoose.Types.ObjectId(dto.warehouseId),
              itemId: new mongoose.Types.ObjectId(itm.itemId),
              documentNumber: grnNumber,
              type: 'purchase',
              direction: 'IN',
              quantity: mongoose.Types.Decimal128.fromString(aQty.toFixed(4)),
              previousQuantity: mongoose.Types.Decimal128.fromString(curQty.toFixed(4)),
              newQuantity: mongoose.Types.Decimal128.fromString(newQty.toFixed(4)),
              batchNumber: itm.batchNumber,
              costRate: mongoose.Types.Decimal128.fromString(cost.toFixed(4)),
              totalCost: mongoose.Types.Decimal128.fromString(total.toFixed(2)),
              date: new Date(),
              remarks: `GRN Inbound Inspection`,
              createdBy: new mongoose.Types.ObjectId(userId),
            },
          ],
          { session }
        );

        // Batch record if declared
        if (itm.batchNumber) {
          await StockBatch.findOneAndUpdate(
            {
              organizationId: orgObjectId,
              warehouseId: new mongoose.Types.ObjectId(dto.warehouseId),
              itemId: new mongoose.Types.ObjectId(itm.itemId),
              batchNumber: itm.batchNumber.trim().toUpperCase(),
            },
            {
              $setOnInsert: {
                initialQuantity: mongoose.Types.Decimal128.fromString(aQty.toFixed(4)),
                costPrice: mongoose.Types.Decimal128.fromString(cost.toFixed(4)),
                expiryDate: itm.expiryDate ? new Date(itm.expiryDate) : undefined,
                firmId: new mongoose.Types.ObjectId(dto.warehouseId),
              },
              $inc: { currentQuantity: mongoose.Types.Decimal128.fromString(aQty.toFixed(4)) },
            },
            { upsert: true, session }
          );
        }
      }

      // If PO linked, update PO received quantities
      if (dto.purchaseOrderId) {
        const po = await PurchaseOrder.findOne({ _id: dto.purchaseOrderId, organizationId: orgObjectId }).session(session);
        if (po) {
          po.status = 'partially_received';
          await po.save({ session });
        }
      }

      const grn = await GoodsReceipt.create(
        [
          {
            organizationId: orgObjectId,
            grnNumber,
            purchaseOrderId: dto.purchaseOrderId ? new mongoose.Types.ObjectId(dto.purchaseOrderId) : undefined,
            supplierId: new mongoose.Types.ObjectId(dto.supplierId),
            warehouseId: new mongoose.Types.ObjectId(dto.warehouseId),
            deliveryChallanNumber: dto.deliveryChallanNumber,
            receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
            status: 'posted',
            items,
            receivedBy: new mongoose.Types.ObjectId(userId),
            notes: dto.notes,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return grn[0];
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ==========================================
  // 5. Sales Orders & Credit Limit Checks
  // ==========================================
  public async getSalesOrders(orgId: string) {
    return SalesOrder.find({ organizationId: new mongoose.Types.ObjectId(orgId) })
      .populate('customerId', 'name panNumber creditLimit currentBalance')
      .populate('items.itemId', 'name code')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async createSalesOrder(orgId: string, dto: SalesOrderDTO, userId: string): Promise<ISalesOrder> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const customer = await Party.findOne({ _id: new mongoose.Types.ObjectId(dto.customerId), organizationId: orgObjectId });
    if (!customer) throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');

    const count = await SalesOrder.countDocuments({ organizationId: orgObjectId });
    const soNumber = `SO-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let taxTotal = 0;
    const items: any[] = [];

    for (const itm of dto.items) {
      const itemDoc = await Item.findById(itm.itemId);
      const qty = parseFloat(itm.orderedQuantity.toString());
      const rate = parseFloat(itm.rate.toString());
      const discount = parseFloat(itm.discountAmount?.toString() || '0');
      const taxable = (qty * rate) - discount;
      const tax = taxable * 0.13;
      const total = taxable + tax;

      subtotal += taxable;
      taxTotal += tax;

      items.push({
        itemId: new mongoose.Types.ObjectId(itm.itemId),
        itemName: itemDoc?.name || 'Item',
        orderedQuantity: mongoose.Types.Decimal128.fromString(qty.toFixed(4)),
        deliveredQuantity: mongoose.Types.Decimal128.fromString('0.00'),
        rate: mongoose.Types.Decimal128.fromString(rate.toFixed(2)),
        discountAmount: mongoose.Types.Decimal128.fromString(discount.toFixed(2)),
        taxableAmount: mongoose.Types.Decimal128.fromString(taxable.toFixed(2)),
        taxRate: mongoose.Types.Decimal128.fromString('13.00'),
        taxAmount: mongoose.Types.Decimal128.fromString(tax.toFixed(2)),
        totalAmount: mongoose.Types.Decimal128.fromString(total.toFixed(2)),
      });
    }

    const grandTotal = subtotal + taxTotal;

    // Credit limit evaluation
    const creditLimit = parseFloat(customer.creditLimit?.toString() || '0');
    const currentBal = parseFloat(customer.currentBalance?.toString() || '0');
    let creditCheckStatus: 'approved' | 'warning' | 'override_required' = 'approved';

    if (creditLimit > 0 && currentBal + grandTotal > creditLimit) {
      creditCheckStatus = 'warning';
      // Trigger notification for credit breach
      await Notification.create({
        organizationId: orgObjectId,
        role: 'manager',
        type: 'credit_breach',
        title: `Credit Limit Exceeded: ${customer.name}`,
        message: `Customer ${customer.name} exceeded credit limit (Limit: NPR ${creditLimit.toLocaleString()}, Potential: NPR ${(currentBal + grandTotal).toLocaleString()})`,
        referenceDocument: soNumber,
      });
    }

    return SalesOrder.create({
      organizationId: orgObjectId,
      firmId: new mongoose.Types.ObjectId(dto.firmId),
      financialYearId: new mongoose.Types.ObjectId(dto.financialYearId),
      soNumber,
      customerId: customer._id,
      customerName: customer.name,
      customerPan: customer.panNumber,
      quotationNumber: dto.quotationNumber,
      orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
      status: 'draft',
      items,
      subtotal: mongoose.Types.Decimal128.fromString(subtotal.toFixed(2)),
      taxTotal: mongoose.Types.Decimal128.fromString(taxTotal.toFixed(2)),
      grandTotal: mongoose.Types.Decimal128.fromString(grandTotal.toFixed(2)),
      creditCheckStatus,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }

  // ==========================================
  // 6. Stock Adjustments & Accounting GL Hook
  // ==========================================
  public async adjustStock(orgId: string, dto: StockAdjustmentDTO, userId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const whId = new mongoose.Types.ObjectId(dto.warehouseId);
      const itmId = new mongoose.Types.ObjectId(dto.itemId);
      const qty = parseFloat(dto.quantity.toString());
      const rate = parseFloat(dto.costRate.toString());
      const totalCost = qty * rate;

      let bal = await StockBalance.findOne({
        organizationId: orgObjectId,
        warehouseId: whId,
        itemId: itmId,
      }).session(session);

      const curQty = bal ? parseFloat(bal.quantity.toString()) : 0;
      const curAvg = bal ? parseFloat(bal.averageCost.toString()) : rate;

      let newQty = curQty;
      if (dto.adjustmentType === 'positive') {
        newQty += qty;
      } else {
        if (curQty < qty) throw new AppError(400, 'INSUFFICIENT_STOCK', 'Insufficient stock for negative adjustment');
        newQty -= qty;
      }

      if (!bal) {
        bal = new StockBalance({
          organizationId: orgObjectId,
          warehouseId: whId,
          itemId: itmId,
          quantity: mongoose.Types.Decimal128.fromString(newQty.toFixed(4)),
          averageCost: mongoose.Types.Decimal128.fromString(rate.toFixed(4)),
          totalValuation: mongoose.Types.Decimal128.fromString((newQty * rate).toFixed(2)),
        });
      } else {
        bal.quantity = mongoose.Types.Decimal128.fromString(newQty.toFixed(4));
        bal.totalValuation = mongoose.Types.Decimal128.fromString((newQty * curAvg).toFixed(2));
      }
      await bal.save({ session });

      // Record audit stock movement
      await StockMovement.create(
        [
          {
            organizationId: orgObjectId,
            warehouseId: whId,
            itemId: itmId,
            documentNumber: `ADJ-${Date.now().toString().slice(-6)}`,
            type: 'adjustment',
            direction: dto.adjustmentType === 'positive' ? 'IN' : 'OUT',
            quantity: mongoose.Types.Decimal128.fromString(qty.toFixed(4)),
            previousQuantity: mongoose.Types.Decimal128.fromString(curQty.toFixed(4)),
            newQuantity: mongoose.Types.Decimal128.fromString(newQty.toFixed(4)),
            batchNumber: dto.batchNumber,
            costRate: mongoose.Types.Decimal128.fromString(rate.toFixed(4)),
            totalCost: mongoose.Types.Decimal128.fromString(totalCost.toFixed(2)),
            date: new Date(),
            remarks: `Physical stock count adjustment: ${dto.reason}`,
            createdBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      // Accounting General Ledger Integration
      const stockAcc = await Account.findOne({ organizationId: orgObjectId, code: '1140' }).session(session);
      const adjIncomeAcc = await Account.findOne({ organizationId: orgObjectId, code: '4200' }).session(session);
      const cogsAcc = await Account.findOne({ organizationId: orgObjectId, code: '5100' }).session(session);

      if (stockAcc && (adjIncomeAcc || cogsAcc)) {
        const isPos = dto.adjustmentType === 'positive';
        const lines = [
          {
            accountId: isPos ? stockAcc._id : cogsAcc?._id || stockAcc._id,
            accountCode: isPos ? stockAcc.code : cogsAcc?.code || '5100',
            accountName: isPos ? stockAcc.name : cogsAcc?.name || 'Stock Adjustment Expense',
            partyId: null,
            debit: mongoose.Types.Decimal128.fromString(totalCost.toFixed(2)),
            credit: mongoose.Types.Decimal128.fromString('0.00'),
            baseDebit: mongoose.Types.Decimal128.fromString(totalCost.toFixed(2)),
            baseCredit: mongoose.Types.Decimal128.fromString('0.00'),
            narration: `Stock Adjustment: ${dto.reason}`,
          },
          {
            accountId: isPos ? adjIncomeAcc?._id || stockAcc._id : stockAcc._id,
            accountCode: isPos ? adjIncomeAcc?.code || '4200' : stockAcc.code,
            accountName: isPos ? adjIncomeAcc?.name || 'Stock Gain' : stockAcc.name,
            partyId: null,
            debit: mongoose.Types.Decimal128.fromString('0.00'),
            credit: mongoose.Types.Decimal128.fromString(totalCost.toFixed(2)),
            baseDebit: mongoose.Types.Decimal128.fromString('0.00'),
            baseCredit: mongoose.Types.Decimal128.fromString(totalCost.toFixed(2)),
            narration: `Stock Adjustment offset`,
          },
        ];

        await JournalEntry.create(
          [
            {
              organizationId: orgObjectId,
              firmId: whId, // mapped
              financialYearId: whId,
              entryNumber: `JV-ADJ-${Date.now().toString().slice(-4)}`,
              date: new Date(),
              bsDate: '2082-05-18',
              narration: `Automatic GL posting for inventory adjustment: ${dto.reason}`,
              status: 'posted',
              sourceModule: 'inventory',
              lines,
              totalDebit: mongoose.Types.Decimal128.fromString(totalCost.toFixed(2)),
              totalCredit: mongoose.Types.Decimal128.fromString(totalCost.toFixed(2)),
              createdBy: new mongoose.Types.ObjectId(userId),
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();
      return { success: true, message: 'Stock adjusted and GL impact posted' };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ==========================================
  // 7. Universal Approval State Machine Handlers
  // ==========================================
  public async approveDocument(orgId: string, docType: string, docId: string, userId: string) {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    let model: any = null;

    if (docType === 'purchase_order') model = PurchaseOrder;
    else if (docType === 'sales_order') model = SalesOrder;
    else if (docType === 'stock_transfer') model = StockTransfer;
    else if (docType === 'purchase_requisition') model = PurchaseRequisition;

    if (!model) throw new AppError(400, 'INVALID_DOC_TYPE', 'Unsupported document type for approval');

    const doc = await model.findOne({ _id: docId, organizationId: orgObjectId });
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');

    doc.status = 'approved';
    doc.approvedBy = new mongoose.Types.ObjectId(userId);
    doc.approvedAt = new Date();
    await doc.save();

    return doc;
  }
}

export const operationsService = new OperationsService();
