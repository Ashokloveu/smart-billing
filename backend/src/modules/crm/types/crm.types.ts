export interface LeadDTO {
  firmId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  panNumber?: string;
  source?: 'website' | 'referral' | 'walk_in' | 'campaign' | 'social_media' | 'import';
  estimatedValue?: string | number;
  assignedTo?: string;
  nextFollowUpDate?: string;
}

export interface OpportunityDTO {
  firmId: string;
  title: string;
  customerId: string;
  leadId?: string;
  stage?: string;
  expectedRevenue: string | number;
  probability?: number;
  expectedCloseDate: string;
  salesOwner: string;
}

export interface QuotationDTO {
  firmId: string;
  financialYearId: string;
  customerId: string;
  opportunityId?: string;
  quotationDate?: string;
  validUntil: string;
  termsAndConditions?: string;
  items: Array<{
    itemId: string;
    quantity: string | number;
    rate: string | number;
    discountAmount?: string | number;
  }>;
}

export interface ActivityDTO {
  customerId?: string;
  leadId?: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'follow_up';
  title: string;
  description: string;
  followUpDate?: string;
}

export interface SalesTargetDTO {
  userId: string;
  periodType?: 'monthly' | 'quarterly';
  periodName: string;
  targetAmount: string | number;
}
