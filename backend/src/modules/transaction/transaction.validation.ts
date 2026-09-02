import { z } from 'zod';

const transactionLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.string().refine((v) => Number(v) > 0, 'Quantity must be positive'),
  rate: z.string().refine((v) => Number(v) >= 0, 'Rate cannot be negative'),
  discountAmount: z.string().optional().default('0.00'),
  taxRate: z.string().optional().default('13.00'),
});

export const createTransactionSchema = z.object({
  body: z.object({
    firmId: z.string().min(1),
    warehouseId: z.string().min(1),
    financialYearId: z.string().min(1),
    type: z.enum(['sale_invoice', 'pos_invoice', 'purchase_bill', 'sales_return', 'purchase_return']),
    date: z.string().optional(),
    bsDate: z.string().min(1),
    dueDate: z.string().optional(),
    partyId: z.string().optional(),
    partyName: z.string().min(1),
    partyPan: z.string().optional(),
    lines: z.array(transactionLineSchema).min(1, 'At least one line item is required'),
    paidAmount: z.string().optional().default('0.00'),
    paymentMode: z.enum(['cash', 'credit', 'bank', 'partial']).default('credit'),
    notes: z.string().optional(),
    status: z.enum(['draft', 'posted']).default('posted'),
  }),
});

export const cancelTransactionSchema = z.object({
  body: z.object({
    reason: z.string().min(3).max(255),
  }),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    amount: z.string().refine((v) => Number(v) > 0, 'Payment amount must be greater than 0'),
    paymentMode: z.enum(['cash', 'bank']),
    reference: z.string().optional(),
  }),
});
