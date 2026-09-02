import { z } from 'zod';

export const stockTransferSchema = z.object({
  body: z.object({
    sourceWarehouseId: z.string().min(1, 'Source warehouse required'),
    destinationWarehouseId: z.string().min(1, 'Destination warehouse required'),
    date: z.string().optional(),
    bsDate: z.string().min(1, 'Nepali date required'),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        itemId: z.string().min(1, 'Item ID required'),
        quantity: z.union([z.string(), z.number()]),
        batchNumber: z.string().optional(),
      })
    ).min(1, 'At least one item required'),
  }),
});

export const stockBatchSchema = z.object({
  body: z.object({
    warehouseId: z.string().min(1, 'Warehouse ID required'),
    itemId: z.string().min(1, 'Item ID required'),
    batchNumber: z.string().min(1, 'Batch number required'),
    manufacturingDate: z.string().optional(),
    expiryDate: z.string().optional(),
    costPrice: z.union([z.string(), z.number()]),
    salePrice: z.union([z.string(), z.number()]).optional(),
    initialQuantity: z.union([z.string(), z.number()]),
    barcode: z.string().optional(),
  }),
});

export const purchaseRequisitionSchema = z.object({
  body: z.object({
    department: z.string().min(1, 'Department required'),
    requiredByDate: z.string().min(1, 'Required by date required'),
    items: z.array(
      z.object({
        itemId: z.string().min(1, 'Item ID required'),
        quantity: z.union([z.string(), z.number()]),
        estimatedRate: z.union([z.string(), z.number()]),
        reason: z.string().optional(),
      })
    ).min(1, 'At least one item required'),
  }),
});

export const purchaseOrderSchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID required'),
    financialYearId: z.string().min(1, 'Fiscal Year ID required'),
    supplierId: z.string().min(1, 'Supplier ID required'),
    requisitionId: z.string().optional(),
    orderDate: z.string().optional(),
    expectedDeliveryDate: z.string().optional(),
    termsAndConditions: z.string().optional(),
    items: z.array(
      z.object({
        itemId: z.string().min(1, 'Item ID required'),
        quantity: z.union([z.string(), z.number()]),
        rate: z.union([z.string(), z.number()]),
      })
    ).min(1, 'At least one item required'),
  }),
});

export const goodsReceiptSchema = z.object({
  body: z.object({
    purchaseOrderId: z.string().optional(),
    supplierId: z.string().min(1, 'Supplier ID required'),
    warehouseId: z.string().min(1, 'Warehouse ID required'),
    deliveryChallanNumber: z.string().optional(),
    receivedDate: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        itemId: z.string().min(1, 'Item ID required'),
        orderedQuantity: z.union([z.string(), z.number()]),
        receivedQuantity: z.union([z.string(), z.number()]),
        acceptedQuantity: z.union([z.string(), z.number()]),
        rejectedQuantity: z.union([z.string(), z.number()]).optional(),
        batchNumber: z.string().optional(),
        expiryDate: z.string().optional(),
        unitCost: z.union([z.string(), z.number()]),
      })
    ).min(1, 'At least one item required'),
  }),
});

export const salesOrderSchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID required'),
    financialYearId: z.string().min(1, 'Fiscal Year ID required'),
    customerId: z.string().min(1, 'Customer ID required'),
    quotationNumber: z.string().optional(),
    orderDate: z.string().optional(),
    deliveryDate: z.string().optional(),
    items: z.array(
      z.object({
        itemId: z.string().min(1, 'Item ID required'),
        orderedQuantity: z.union([z.string(), z.number()]),
        rate: z.union([z.string(), z.number()]),
        discountAmount: z.union([z.string(), z.number()]).optional(),
      })
    ).min(1, 'At least one item required'),
  }),
});

export const stockAdjustmentSchema = z.object({
  body: z.object({
    warehouseId: z.string().min(1, 'Warehouse ID required'),
    itemId: z.string().min(1, 'Item ID required'),
    adjustmentType: z.enum(['positive', 'negative']),
    quantity: z.union([z.string(), z.number()]),
    costRate: z.union([z.string(), z.number()]),
    reason: z.string().min(1, 'Reason required'),
    batchNumber: z.string().optional(),
  }),
});
