import { z } from 'zod';

export const reportFilterSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    warehouseId: z.string().optional(),
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
  }),
});
