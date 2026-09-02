import { DecimalOrString } from '../utils/decimal';

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  currency: string;
  taxRegistration: {
    type: 'PAN' | 'VAT';
    number: string;
    verified: boolean;
  };
}

export interface Firm {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  isHeadOffice: boolean;
  address: {
    line1: string;
    city: string;
    district: string;
    province: string;
  };
  phone: string;
}

export interface FiscalPeriod {
  _id: string;
  organizationId: string;
  label: string;
  startDate: string;
  endDate: string;
  bsStartDate: string;
  bsEndDate: string;
  isClosed: boolean;
  isCurrent: boolean;
}

export interface Party {
  _id: string;
  organizationId: string;
  type: 'customer' | 'supplier' | 'both';
  name: string;
  panNumber?: string;
  email?: string;
  phone: string;
  billingAddress: {
    city: string;
    district: string;
    province: string;
  };
  creditLimit: DecimalOrString;
  currentBalance: DecimalOrString;
  isActive: boolean;
}

export interface Category {
  _id: string;
  organizationId: string;
  name: string;
}

export interface Unit {
  _id: string;
  organizationId: string;
  name: string;
  abbreviation: string;
}

export interface TaxPolicy {
  _id: string;
  organizationId: string;
  name: string;
  taxType: string;
  rate: DecimalOrString;
  isInclusive: boolean;
}

export interface Item {
  _id: string;
  organizationId: string;
  type: 'product' | 'service';
  name: string;
  code: string;
  barcode?: string;
  categoryId: { _id: string; name: string } | string;
  primaryUnitId: { _id: string; name: string; abbreviation: string } | string;
  taxPolicyId: { _id: string; name: string; rate: DecimalOrString } | string;
  salePrice: DecimalOrString;
  purchasePrice: DecimalOrString;
  isStockTracked: boolean;
  minimumStock?: DecimalOrString;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}
