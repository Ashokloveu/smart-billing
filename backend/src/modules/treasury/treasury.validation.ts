import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const money = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a positive monetary value');

export const createTreasuryAccountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    type: z.enum(['bank', 'cash', 'ewallet']),
    accountNumber: z.string().trim().max(50).optional().or(z.literal('')),
    bankName: z.string().trim().max(120).optional().or(z.literal('')),
    branch: z.string().trim().max(120).optional().or(z.literal('')),
    openingBalance: money.default('0.00'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2563eb'),
  }).superRefine((value, ctx) => {
    if (value.type === 'bank' && (!value.accountNumber || !value.bankName)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bank name and account number are required for bank accounts' });
    }
  }),
});

export const createFundTransferSchema = z.object({
  body: z.object({
    fromAccountId: objectId,
    toAccountId: objectId,
    amount: money.refine((amount) => Number(amount) > 0, 'Amount must be greater than zero'),
    date: z.string().datetime().optional(),
    bsDate: z.string().trim().min(1).max(20),
    narration: z.string().trim().min(2).max(500),
  }).refine((value) => value.fromAccountId !== value.toAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['toAccountId'],
  }),
});

export const createChequeSchema = z.object({
  body: z.object({
    chequeNumber: z.string().trim().min(1).max(50),
    amount: money.refine((amount) => Number(amount) > 0, 'Amount must be greater than zero'),
    chequeDate: z.string().datetime(),
    partyName: z.string().trim().min(2).max(150),
    bankName: z.string().trim().min(2).max(120),
    type: z.enum(['receive', 'issue']),
    remarks: z.string().trim().max(500).optional(),
  }),
});

export const updateChequeStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'deposited', 'cleared', 'bounced', 'cancelled']),
  }),
});

export const setReconciliationSchema = z.object({
  body: z.object({ reconciled: z.boolean() }),
});
