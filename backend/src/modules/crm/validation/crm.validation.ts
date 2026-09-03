import { z } from 'zod';

export const leadSchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID required'),
    companyName: z.string().min(1, 'Company name required'),
    contactPerson: z.string().min(1, 'Contact person required'),
    email: z.string().email('Valid email required'),
    phone: z.string().min(7, 'Valid phone required'),
    panNumber: z.string().optional(),
    source: z
      .enum(['website', 'referral', 'walk_in', 'campaign', 'social_media', 'import'])
      .optional(),
    estimatedValue: z.union([z.string(), z.number()]).optional(),
    assignedTo: z.string().optional(),
    nextFollowUpDate: z.string().optional(),
  }),
});

export const opportunitySchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID required'),
    title: z.string().min(1, 'Title required'),
    customerId: z.string().min(1, 'Customer ID required'),
    leadId: z.string().optional(),
    stage: z.string().optional(),
    expectedRevenue: z.union([z.string(), z.number()]),
    probability: z.number().min(0).max(100).optional(),
    expectedCloseDate: z.string().min(1, 'Expected close date required'),
    salesOwner: z.string().min(1, 'Sales owner required'),
  }),
});

export const quotationSchema = z.object({
  body: z.object({
    firmId: z.string().min(1, 'Firm ID required'),
    financialYearId: z.string().min(1, 'Fiscal Year ID required'),
    customerId: z.string().min(1, 'Customer ID required'),
    opportunityId: z.string().optional(),
    quotationDate: z.string().optional(),
    validUntil: z.string().min(1, 'Valid until date required'),
    termsAndConditions: z.string().optional(),
    items: z
      .array(
        z.object({
          itemId: z.string().min(1, 'Item ID required'),
          quantity: z.union([z.string(), z.number()]),
          rate: z.union([z.string(), z.number()]),
          discountAmount: z.union([z.string(), z.number()]).optional(),
        })
      )
      .min(1, 'At least one item required'),
  }),
});

export const activitySchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    leadId: z.string().optional(),
    type: z.enum(['call', 'email', 'meeting', 'note', 'follow_up']),
    title: z.string().min(1, 'Title required'),
    description: z.string().min(1, 'Description required'),
    followUpDate: z.string().optional(),
  }),
});

export const salesTargetSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID required'),
    periodType: z.enum(['monthly', 'quarterly']).optional(),
    periodName: z.string().min(1, 'Period name required'),
    targetAmount: z.union([z.string(), z.number()]),
  }),
});
