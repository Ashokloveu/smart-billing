import { z } from 'zod';

export const createWarehouseSchema = z.object({
  body: z.object({
    firmId: z.string().min(1),
    name: z.string().min(2).max(100),
    code: z.string().min(1).max(20),
    address: z.object({
      line1: z.string().optional().default(''),
      city: z.string().min(1),
      district: z.string().min(1),
      province: z.string().min(1),
    }).optional(),
    isDefault: z.boolean().default(false),
  }),
});

export const openingStockSchema = z.object({
  body: z.object({
    warehouseId: z.string().min(1),
    items: z.array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.string().refine((v) => Number(v) > 0, 'Quantity must be greater than 0'),
        costRate: z.string().refine((v) => Number(v) >= 0, 'Cost rate cannot be negative'),
      })
    ).min(1, 'At least one item is required'),
  }),
});

export const stockAdjustmentSchema = z.object({
  body: z.object({
    warehouseId: z.string().min(1),
    itemId: z.string().min(1),
    reason: z.enum(['damage', 'loss', 'correction']),
    action: z.enum(['add', 'reduce']),
    quantity: z.string().refine((v) => Number(v) > 0, 'Quantity must be positive'),
    unitCost: z.string().optional(),
    remarks: z.string().min(2).max(255),
  }),
});

export const stockTransferSchema = z.object({
  body: z.object({
    sourceWarehouseId: z.string().min(1),
    targetWarehouseId: z.string().min(1),
    items: z.array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.string().refine((v) => Number(v) > 0, 'Quantity must be greater than 0'),
      })
    ).min(1, 'At least one item must be transferred'),
    remarks: z.string().optional(),
  }),
});
