import { z } from 'zod';

export const createAccountSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Account code is required').trim(),
    name: z.string().min(1, 'Account name is required').trim(),
    type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
    group: z.string().min(1, 'Account group is required').trim(),
    parentAccountId: z.string().optional(),
    openingBalance: z.string().optional(),
    currency: z.string().optional(),
  }),
});

const journalLineSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  partyId: z.string().optional(),
  debit: z.string().default('0.00'),
  credit: z.string().default('0.00'),
  narration: z.string().optional(),
});

export const createJournalEntrySchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID is required'),
    financialYearId: z.string().min(1, 'Financial Year ID is required'),
    date: z.string().optional(),
    bsDate: z.string().min(1, 'Bikram Sambat date is required'),
    narration: z.string().min(1, 'Voucher narration is required').trim(),
    status: z.enum(['draft', 'posted']).optional(),
    sourceModule: z.enum(['manual', 'sales', 'purchase', 'pos', 'payment', 'inventory', 'expense', 'treasury']).optional(),
    sourceDocumentId: z.string().optional(),
    sourceDocumentNumber: z.string().optional(),
    currency: z.string().optional(),
    exchangeRate: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, 'Journal voucher must have at least 2 lines'),
    attachments: z.array(z.string()).optional(),
  }),
});

export const rejectJournalSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required').trim(),
  }),
});

export const reverseJournalSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Reversal reason is required').trim(),
  }),
});

export const bulkOpeningBalanceSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          accountId: z.string().min(1),
          openingBalance: z.string(),
          type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
        })
      )
      .min(1, 'At least one account opening balance required'),
  }),
});

export const dateRangeQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    date: z.string().optional(),
  }),
});
