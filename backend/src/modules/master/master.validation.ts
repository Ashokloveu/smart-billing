import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    legalName: z.string().min(2).max(160).optional(),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    industry: z.string().min(2).max(80).optional(),
    baseCity: z.string().min(1).max(100).optional(),
    country: z.string().default('NP'),
    currency: z.string().default('NPR'),
    taxRegistration: z.object({
      type: z.enum(['PAN', 'VAT']),
      number: z.string().regex(/^[0-9]{9}$/, 'PAN must be exactly 9 numeric digits'),
    }),
    settings: z.object({
      defaultCurrency: z.string().default('NPR'),
      decimalPrecision: z.number().int().min(0).max(4).default(2),
      roundOffMethod: z.enum(['nearest', 'up', 'down', 'none']).default('nearest'),
      allowNegativeStock: z.boolean().default(false),
      displayCalendar: z.enum(['bikram_sambat', 'gregorian', 'both']).default('both'),
      primaryLanguage: z.enum(['en', 'ne', 'bilingual']).default('bilingual'),
    }).optional(),
  }),
});

export const createFirmSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.string().min(1).max(20),
    isHeadOffice: z.boolean().default(false),
    address: z.object({
      line1: z.string().default(''),
      city: z.string().min(1),
      district: z.string().min(1),
      province: z.string().min(1),
    }),
    phone: z.string().min(7),
    email: z.string().email().optional(),
  }),
});

export const createFiscalPeriodSchema = z.object({
  body: z.object({
    label: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    bsStartDate: z.string().min(1),
    bsEndDate: z.string().min(1),
    isCurrent: z.boolean().default(true),
  }),
});

export const createPartySchema = z.object({
  body: z.object({
    type: z.enum(['customer', 'supplier', 'both']),
    name: z.string().min(2).max(150),
    panNumber: z.string().regex(/^[0-9]{9}$/, 'PAN must be 9 digits').optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(7),
    billingAddress: z.object({
      line1: z.string().optional().default(''),
      city: z.string().min(1),
      district: z.string().min(1),
      province: z.string().min(1),
    }),
    creditLimit: z.string().optional().default('0.00'),
    openingBalance: z.object({
      amount: z.string().default('0.00'),
      date: z.string().optional(),
    }).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    parentCategoryId: z.string().nullable().optional(),
  }),
});

export const createUnitSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    abbreviation: z.string().min(1).max(10),
  }),
});

export const createTaxPolicySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    taxType: z.enum(['VAT', 'EXCISE', 'NON_TAXABLE']),
    rate: z.string().default('13.00'),
    isInclusive: z.boolean().default(false),
  }),
});

export const createItemSchema = z.object({
  body: z.object({
    type: z.enum(['product', 'service']),
    name: z.string().min(2).max(150),
    code: z.string().min(1).max(50),
    barcode: z.string().optional(),
    categoryId: z.string(),
    primaryUnitId: z.string(),
    secondaryUnitId: z.string().optional(),
    conversionFactor: z.string().optional(),
    hsnSacCode: z.string().optional(),
    taxPolicyId: z.string(),
    salePrice: z.string().default('0.00'),
    purchasePrice: z.string().default('0.00'),
    isStockTracked: z.boolean().default(true),
    minimumStock: z.string().optional(),
  }),
});
