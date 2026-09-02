import mongoose from 'mongoose';
import { Transaction } from '../../models/Transaction.js';
import { Party } from '../../models/Party.js';
import { Item } from '../../models/Item.js';
import { StockBalance } from '../../models/StockBalance.js';
import {
  ReportFilterQuery,
  DashboardSummaryResponse,
  SalesSummaryResponse,
  PurchaseSummaryResponse,
  InventorySummaryResponse,
  ProfitLossResponse,
  TopSellingItemResponse,
  OutstandingSummaryResponse,
} from './reports.types.js';

export class ReportsService {
  // Helper to build date and location match conditions
  private buildTransactionFilter(orgId: string, query: ReportFilterQuery, extraTypes?: string[]) {
    const filter: any = {
      organizationId: new mongoose.Types.ObjectId(orgId),
      status: 'posted',
    };

    if (extraTypes && extraTypes.length > 0) {
      filter.type = { $in: extraTypes };
    }

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) {
        filter.date.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (query.warehouseId && query.warehouseId !== 'all') {
      filter.warehouseId = new mongoose.Types.ObjectId(query.warehouseId);
    }

    if (query.customerId) {
      filter.partyId = new mongoose.Types.ObjectId(query.customerId);
    } else if (query.supplierId) {
      filter.partyId = new mongoose.Types.ObjectId(query.supplierId);
    }

    return filter;
  }

  // 1. Dashboard Summary
  public async getDashboardSummary(orgId: string): Promise<DashboardSummaryResponse> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);

    // Aggregate Sales, Purchases, Invoices Count
    const txnAgg = await Transaction.aggregate([
      { $match: { organizationId: orgObjectId, status: 'posted' } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalSales = 0;
    let totalPurchase = 0;
    let totalInvoices = 0;

    for (const group of txnAgg) {
      const amt = Number(group.totalAmount?.toString() || 0);
      if (group._id === 'sale_invoice' || group._id === 'pos_invoice') {
        totalSales += amt;
        totalInvoices += group.count;
      } else if (group._id === 'sales_return') {
        totalSales -= amt;
      } else if (group._id === 'purchase_bill') {
        totalPurchase += amt;
      } else if (group._id === 'purchase_return') {
        totalPurchase -= amt;
      }
    }

    // Party counts
    const [customerCount, supplierCount] = await Promise.all([
      Party.countDocuments({ organizationId: orgObjectId, type: { $in: ['customer', 'both'] }, isActive: true }),
      Party.countDocuments({ organizationId: orgObjectId, type: { $in: ['supplier', 'both'] }, isActive: true }),
    ]);

    // Inventory Valuation & Low Stock
    const balances = await StockBalance.find({ organizationId: orgObjectId });
    let inventoryValuation = 0;
    for (const b of balances) {
      inventoryValuation += Number(b.totalValuation?.toString() || 0);
    }

    // Low stock count calculation
    const items = await Item.find({ organizationId: orgObjectId, isStockTracked: true });
    let lowStockCount = 0;
    for (const item of items) {
      const min = Number(item.minimumStock?.toString() || 0);
      const matchedBalances = balances.filter((b) => b.itemId.toString() === item._id.toString());
      const currentQty = matchedBalances.reduce((acc, curr) => acc + Number(curr.quantity.toString()), 0);
      if (currentQty <= min) {
        lowStockCount += 1;
      }
    }

    const totalProfit = Math.max(0, totalSales - totalPurchase);

    return {
      totalSales: Number(totalSales.toFixed(2)),
      totalPurchase: Number(totalPurchase.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      totalInvoices,
      totalCustomers: customerCount,
      totalSuppliers: supplierCount,
      inventoryValuation: Number(inventoryValuation.toFixed(2)),
      lowStockCount,
    };
  }

  // 2. Sales Summary (Trends & Drilldowns)
  public async getSalesSummary(orgId: string, query: ReportFilterQuery): Promise<SalesSummaryResponse> {
    const filter = this.buildTransactionFilter(orgId, query, ['sale_invoice', 'pos_invoice']);

    const [totalsAgg, dailyAgg, monthlyAgg, yearlyAgg, byCustomerAgg, linesAgg] = await Promise.all([
      // Overall totals
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            totalDiscount: { $sum: '$totalDiscount' },
            totalTax: { $sum: '$totalTax' },
          },
        },
      ]),
      // Daily Trend
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            amount: { $sum: '$grandTotal' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Monthly Trend
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            amount: { $sum: '$grandTotal' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Yearly Trend
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $year: '$date' },
            amount: { $sum: '$grandTotal' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // By Customer
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$partyId',
            partyName: { $first: '$partyName' },
            revenue: { $sum: '$grandTotal' },
            invoiceCount: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 15 },
      ]),
      // By Item Breakdown
      Transaction.aggregate([
        { $match: filter },
        { $unwind: '$lines' },
        {
          $group: {
            _id: '$lines.itemId',
            itemName: { $first: '$lines.itemName' },
            itemCode: { $first: '$lines.itemCode' },
            quantity: { $sum: '$lines.quantity' },
            revenue: { $sum: '$lines.lineTotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const totalSales = totalsAgg.length > 0 ? Number(totalsAgg[0].totalSales.toString()) : 0;
    const totalDiscount = totalsAgg.length > 0 ? Number(totalsAgg[0].totalDiscount.toString()) : 0;
    const totalTax = totalsAgg.length > 0 ? Number(totalsAgg[0].totalTax.toString()) : 0;

    // Resolve Categories for items
    const byCategoryMap: Record<string, number> = {};
    for (const itemRow of linesAgg) {
      const it = await Item.findById(itemRow._id).populate('categoryId', 'name');
      const catName = (it?.categoryId as any)?.name || 'Uncategorized';
      byCategoryMap[catName] = (byCategoryMap[catName] || 0) + Number(itemRow.revenue.toString());
    }

    const byCategory = Object.entries(byCategoryMap).map(([categoryName, revenue]) => ({
      categoryId: categoryName,
      categoryName,
      revenue: Number(revenue.toFixed(2)),
    }));

    return {
      totalSales: Number(totalSales.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      daily: dailyAgg.map((d) => ({ date: d._id, amount: Number(Number(d.amount.toString()).toFixed(2)), count: d.count })),
      monthly: monthlyAgg.map((m) => ({ month: m._id, amount: Number(Number(m.amount.toString()).toFixed(2)), count: m.count })),
      yearly: yearlyAgg.map((y) => ({ year: y._id, amount: Number(Number(y.amount.toString()).toFixed(2)), count: y.count })),
      byItem: linesAgg.map((l) => ({
        itemId: l._id?.toString(),
        itemName: l.itemName,
        itemCode: l.itemCode,
        quantity: Number(Number(l.quantity.toString()).toFixed(2)),
        revenue: Number(Number(l.revenue.toString()).toFixed(2)),
      })),
      byCategory,
      byCustomer: byCustomerAgg.map((c) => ({
        partyId: c._id ? c._id.toString() : 'Walk-in',
        partyName: c.partyName || 'Cash Walk-in Customer',
        revenue: Number(Number(c.revenue.toString()).toFixed(2)),
        invoiceCount: c.invoiceCount,
      })),
    };
  }

  // 3. Purchase Summary
  public async getPurchaseSummary(orgId: string, query: ReportFilterQuery): Promise<PurchaseSummaryResponse> {
    const filter = this.buildTransactionFilter(orgId, query, ['purchase_bill']);

    const [trendsAgg, supplierAgg, itemsAgg] = await Promise.all([
      // Monthly purchase trend
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            amount: { $sum: '$grandTotal' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Supplier wise purchase
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$partyId',
            supplierName: { $first: '$partyName' },
            amount: { $sum: '$grandTotal' },
            billCount: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),
      // Item wise purchase
      Transaction.aggregate([
        { $match: filter },
        { $unwind: '$lines' },
        {
          $group: {
            _id: '$lines.itemId',
            itemName: { $first: '$lines.itemName' },
            itemCode: { $first: '$lines.itemCode' },
            quantity: { $sum: '$lines.quantity' },
            cost: { $sum: '$lines.lineTotal' },
          },
        },
        { $sort: { cost: -1 } },
      ]),
    ]);

    const totalPurchase = trendsAgg.reduce((acc, t) => acc + Number(t.amount.toString()), 0);

    return {
      totalPurchase: Number(totalPurchase.toFixed(2)),
      trends: trendsAgg.map((t) => ({ month: t._id, amount: Number(Number(t.amount.toString()).toFixed(2)), count: t.count })),
      supplierWise: supplierAgg.map((s) => ({
        supplierId: s._id ? s._id.toString() : '',
        supplierName: s.supplierName,
        amount: Number(Number(s.amount.toString()).toFixed(2)),
        billCount: s.billCount,
      })),
      itemWise: itemsAgg.map((i) => ({
        itemId: i._id?.toString(),
        itemName: i.itemName,
        itemCode: i.itemCode,
        quantity: Number(Number(i.quantity.toString()).toFixed(2)),
        cost: Number(Number(i.cost.toString()).toFixed(2)),
      })),
    };
  }

  // 4. Inventory Summary
  public async getInventorySummary(orgId: string, query: ReportFilterQuery): Promise<InventorySummaryResponse> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const balanceFilter: any = { organizationId: orgObjectId };

    if (query.warehouseId && query.warehouseId !== 'all') {
      balanceFilter.warehouseId = new mongoose.Types.ObjectId(query.warehouseId);
    }

    const balances = await StockBalance.find(balanceFilter)
      .populate('itemId', 'name code minimumStock')
      .populate('warehouseId', 'name code');

    let totalStockQuantity = 0;
    let stockValuation = 0;

    const warehouseMap: Record<string, { name: string; qty: number; val: number }> = {};
    const lowStockItems = [];
    const deadStockItems = [];

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    for (const b of balances) {
      const qty = Number(b.quantity.toString());
      const val = Number(b.totalValuation.toString());
      totalStockQuantity += qty;
      stockValuation += val;

      // Warehouse grouping
      const whId = (b.warehouseId as any)?._id?.toString() || 'unknown';
      const whName = (b.warehouseId as any)?.name || 'Default Godown';
      if (!warehouseMap[whId]) {
        warehouseMap[whId] = { name: whName, qty: 0, val: 0 };
      }
      warehouseMap[whId].qty += qty;
      warehouseMap[whId].val += val;

      // Low Stock detection
      const minStock = Number((b.itemId as any)?.minimumStock?.toString() || 0);
      if (qty <= minStock) {
        lowStockItems.push({
          itemId: (b.itemId as any)?._id?.toString(),
          name: (b.itemId as any)?.name || 'Item',
          code: (b.itemId as any)?.code || '',
          currentQuantity: qty,
          minimumStock: minStock,
          deficit: Math.max(0, minStock - qty),
        });
      }

      // Dead Stock detection (No movements in 90 days and stock > 0)
      if (b.lastMovementDate && new Date(b.lastMovementDate) < ninetyDaysAgo && qty > 0) {
        deadStockItems.push({
          itemId: (b.itemId as any)?._id?.toString(),
          name: (b.itemId as any)?.name || 'Item',
          code: (b.itemId as any)?.code || '',
          currentQuantity: qty,
          lastMovementDate: b.lastMovementDate,
        });
      }
    }

    const warehouseWise = Object.entries(warehouseMap).map(([warehouseId, data]) => ({
      warehouseId,
      warehouseName: data.name,
      totalQuantity: Number(data.qty.toFixed(2)),
      valuation: Number(data.val.toFixed(2)),
    }));

    return {
      totalStockQuantity: Number(totalStockQuantity.toFixed(2)),
      stockValuation: Number(stockValuation.toFixed(2)),
      warehouseWise,
      lowStockItems,
      deadStockItems,
    };
  }

  // 5. Profit & Loss Summary
  public async getProfitLoss(orgId: string, query: ReportFilterQuery): Promise<ProfitLossResponse> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);

    const matchStage: any = { organizationId: orgObjectId, status: 'posted' };
    if (query.startDate || query.endDate) {
      matchStage.date = {};
      if (query.startDate) matchStage.date.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.date.$lte = end;
      }
    }

    const txnAgg = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$grandTotal' },
        },
      },
    ]);

    let salesRevenue = 0;
    let purchaseCost = 0;

    for (const group of txnAgg) {
      const amt = Number(group.totalAmount?.toString() || 0);
      if (group._id === 'sale_invoice' || group._id === 'pos_invoice') {
        salesRevenue += amt;
      } else if (group._id === 'sales_return') {
        salesRevenue -= amt;
      } else if (group._id === 'purchase_bill') {
        purchaseCost += amt;
      } else if (group._id === 'purchase_return') {
        purchaseCost -= amt;
      }
    }

    const grossProfit = salesRevenue - purchaseCost;
    const profitPercentage = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;

    return {
      salesRevenue: Number(salesRevenue.toFixed(2)),
      purchaseCost: Number(purchaseCost.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      profitPercentage: Number(profitPercentage.toFixed(2)),
    };
  }

  // 6. Top Selling Items
  public async getTopSellingItems(orgId: string, query: ReportFilterQuery): Promise<TopSellingItemResponse> {
    const filter = this.buildTransactionFilter(orgId, query, ['sale_invoice', 'pos_invoice']);

    const agg = await Transaction.aggregate([
      { $match: filter },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.itemId',
          name: { $first: '$lines.itemName' },
          code: { $first: '$lines.itemCode' },
          quantitySold: { $sum: '$lines.quantity' },
          revenue: { $sum: '$lines.lineTotal' },
        },
      },
    ]);

    const formatted = agg.map((a) => ({
      itemId: a._id?.toString(),
      name: a.name,
      code: a.code,
      quantitySold: Number(Number(a.quantitySold.toString()).toFixed(2)),
      revenue: Number(Number(a.revenue.toString()).toFixed(2)),
    }));

    const byQuantity = [...formatted].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);
    const byRevenue = [...formatted].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return { byQuantity, byRevenue };
  }

  // 7. Outstanding Summary (Receivables & Payables)
  public async getOutstandingSummary(orgId: string): Promise<OutstandingSummaryResponse> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);

    const parties = await Party.find({ organizationId: orgObjectId, isActive: true });

    let customerReceivable = 0;
    let supplierPayable = 0;

    const receivablesList = [];
    const payablesList = [];

    for (const p of parties) {
      const bal = Number(p.currentBalance?.toString() || 0);

      if (p.type === 'customer' || p.type === 'both') {
        if (bal > 0) {
          customerReceivable += bal;
          receivablesList.push({ partyId: p._id.toString(), name: p.name, phone: p.phone, balance: bal });
        }
      }

      if (p.type === 'supplier' || p.type === 'both') {
        if (bal > 0) {
          supplierPayable += bal;
          payablesList.push({ partyId: p._id.toString(), name: p.name, phone: p.phone, balance: bal });
        }
      }
    }

    receivablesList.sort((a, b) => b.balance - a.balance);
    payablesList.sort((a, b) => b.balance - a.balance);

    return {
      customerReceivable: Number(customerReceivable.toFixed(2)),
      supplierPayable: Number(supplierPayable.toFixed(2)),
      topReceivables: receivablesList.slice(0, 10),
      topPayables: payablesList.slice(0, 10),
    };
  }
}

export const reportsService = new ReportsService();
