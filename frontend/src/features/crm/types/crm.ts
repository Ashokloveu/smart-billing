import { DecimalOrString } from '../../../utils/decimal';

export interface Lead {
  _id: string;
  leadNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  panNumber?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
  score: number;
  estimatedValue: DecimalOrString;
  assignedTo?: { _id: string; fullName: string; email: string };
  convertedPartyId?: string;
  convertedOpportunityId?: string;
  lostReason?: string;
  nextFollowUpDate?: string;
  createdAt: string;
}

export interface Opportunity {
  _id: string;
  opportunityNumber: string;
  title: string;
  customerId: { _id: string; name: string; email?: string; phone?: string };
  stage:
    | 'prospecting'
    | 'qualification'
    | 'needs_analysis'
    | 'value_proposition'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';
  expectedRevenue: DecimalOrString;
  probability: number;
  weightedRevenue: DecimalOrString;
  expectedCloseDate: string;
  salesOwner: { _id: string; fullName: string; email: string };
  createdAt: string;
}

export interface Quotation {
  _id: string;
  quotationNumber: string;
  version: number;
  customerId: { _id: string; name: string; panNumber?: string; email?: string; phone?: string };
  customerName: string;
  customerPan?: string;
  quotationDate: string;
  validUntil: string;
  status: 'draft' | 'submitted' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'converted';
  items: Array<{
    itemId: { _id: string; name: string; code: string };
    itemName: string;
    quantity: DecimalOrString;
    rate: DecimalOrString;
    discountAmount: DecimalOrString;
    taxableAmount: DecimalOrString;
    taxRate: DecimalOrString;
    taxAmount: DecimalOrString;
    totalAmount: DecimalOrString;
  }>;
  subtotal: DecimalOrString;
  taxTotal: DecimalOrString;
  grandTotal: DecimalOrString;
  termsAndConditions?: string;
  convertedSalesOrderId?: string;
  createdAt: string;
}

export interface Customer360 {
  customer: {
    _id: string;
    name: string;
    panNumber?: string;
    email?: string;
    phone: string;
    creditLimit: DecimalOrString;
    currentBalance: DecimalOrString;
  };
  credit: {
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
    status: 'normal' | 'breached';
  };
  invoices: any[];
  quotations: any[];
  opportunities: any[];
  activities: any[];
}

export interface SalesTarget {
  _id: string;
  userId: { _id: string; fullName: string; email: string };
  periodType: string;
  periodName: string;
  targetAmount: DecimalOrString;
  achievedAmount: DecimalOrString;
  status: string;
}
