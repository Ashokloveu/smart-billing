import { z } from 'zod';

export const vatRegisterQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    firmId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const documentSequenceConfigSchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID is required'),
    financialYearId: z.string().min(1, 'Financial Year ID is required'),
    type: z.enum(['sale_invoice', 'pos_invoice', 'purchase_bill', 'sales_return', 'purchase_return', 'journal_entry']),
    prefix: z.string().min(1, 'Prefix is required').max(10, 'Prefix too long'),
    nextNumber: z.number().int().positive().optional(),
  }),
});

export const closeFiscalPeriodSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Closing reason is required'),
  }),
});
