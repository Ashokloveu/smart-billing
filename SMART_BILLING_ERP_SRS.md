# SMART BILLING ERP SYSTEM
## Requirements Specification Document (SRS)
### Version 1.0 | September 2026

> **Source Materials**: APK_STUDY.md (Vyapar v20.0.0), NEPAL_IMPLEMENTATION_SPEC.md, WEB_APP_BLUEPRINT.md, AndroidManifest.xml (273 activities), JADX sources (90 packages).
> **Jurisdiction**: Nepal — NPR, Bikram Sambat, IRD VAT/PAN, Asia/Kathmandu.
> **No code yet.** Design-only document.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Complete Modules](#2-complete-modules)
3. [User Roles and Permissions](#3-user-roles-and-permissions)
4. [Every Screen / Page](#4-every-screen--page)
5. [Business Workflows](#5-business-workflows)
6. [Database Schema — MongoDB](#6-database-schema--mongodb)
7. [Backend API List](#7-backend-api-list)
8. [Frontend Components](#8-frontend-components)
9. [Accounting Logic](#9-accounting-logic)
10. [Invoice Calculation Rules](#10-invoice-calculation-rules)
11. [GST / VAT Implementation](#11-gst--vat-implementation)
12. [Inventory Workflow](#12-inventory-workflow)
13. [Reports](#13-reports)
14. [Security Requirements](#14-security-requirements)
15. [Appendix: Glossary & State Machines](#15-appendix-glossary--state-machines)

---

## 1. System Overview

### 1.1 Product Statement

**Smart Billing ERP** is an online-first, multi-tenant billing, bookkeeping, inventory, and business-management web application for Nepali small and medium enterprises. It gives a business owner one place to create invoices, manage customers and suppliers, track stock and money flows, and understand business health through dependable accounting reports — while remaining compliant with Nepal Inland Revenue Department (IRD) requirements.

### 1.2 Design Principles

| Principle | Rule |
|---|---|
| One action, all books updated | Posting any transaction updates party ledger, stock ledger, taxes, and cash/bank in one atomic DB operation |
| Drafts editable; posted books traceable | Posted documents corrected only via controlled edits or reversals; history never deleted |
| Server authority | Totals, sequences, permissions, and accounting rules enforced by backend only |
| Jurisdiction-ready | Tax labels, rates, document terminology are policy/config modules — not hardwired |
| Progressive complexity | Basic billing usable immediately; batches, manufacturing, loyalty appear only when enabled |
| Desktop-efficient, mobile-capable | Keyboard + table workflows on desktop; all essential actions usable on mobile |

### 1.3 Fixed Regional Defaults

| Setting | Default |
|---|---|
| Currency | NPR (Nepalese Rupee) |
| Timezone | Asia/Kathmandu (UTC+05:45) |
| Internal date storage | Gregorian date + UTC timestamp |
| Display calendars | Gregorian and Bikram Sambat (BS) |
| Invoice languages | English, Nepali, or bilingual |
| Fiscal year | Shrawan 1 – Ashad end (≈ mid-Jul to mid-Jul), configurable |
| Money precision | Decimal; currency scale configurable; never binary float |

Bikram Sambat conversion is a presentation-layer concern. All database queries, reports, and accounting logic use Gregorian dates internally.

### 1.4 Phased Delivery

| Phase | Scope |
|---|---|
| **Phase 1 — Accounting MVP** | Auth, org/company/firm, fiscal year, RBAC, parties, items/services, units, categories, taxes, sale, purchase, payment-in/out, expense, returns, cash/bank, PDF invoice, party ledger, receivable/payable, stock, day book, cash flow, P&L, import/export, audit log, backups |
| **Phase 2 — Business Controls** | Estimates, orders, delivery challans, conversions, batch/serial tracking, multiple stores, stock transfers, GST/TDS/TCS reports, scheduled reports, reminders, custom fields, invoice designer, multi-user real-time collab, offline/PWA |
| **Phase 3 — Advanced Modules** | Manufacturing/BOM, fixed assets, loyalty, service reminders, online catalogue/store, payment links, lending/credit, referral, marketplace integrations |

---

## 2. Complete Modules

### 2.1 Module Map

| # | Module | Phase | Description |
|---|---|---|---|
| M-01 | Authentication & Identity | 1 | Phone/OTP sign-up, login, password reset, MFA option, session management |
| M-02 | Organization & Company | 1 | Multi-tenant org, company/firm/branch, financial year, business profile, logo, tax identity |
| M-03 | User & Role Management | 1 | User invitation, profiles, roles (owner/admin/accountant/billing/salesperson/viewer), granular permissions, security logs |
| M-04 | Party Management | 1 | Customers & suppliers, addresses, groups, opening balances, credit limits, custom fields, import/export, party statements |
| M-05 | Item & Service Catalogue | 1 | Products & services, codes/barcodes, categories, units, primary/secondary unit conversion, images, HSN/SAC, tax mapping, pricing |
| M-06 | Inventory Management | 1 | Opening stock, stock adjustments, low-stock alerts, stock valuation, add/reduce stock |
| M-07 | Sale Transactions | 1 | Sale invoice, cash sale, draft/post lifecycle, PDF generation, print/share |
| M-08 | Purchase Transactions | 1 | Purchase bill, draft/post lifecycle |
| M-09 | Payments & Receipts | 1 | Payment-in (receipt), payment-out, split payments, advance/allocation, cheque tracking |
| M-10 | Expense & Other Income | 1 | Expense vouchers, other income vouchers, categories |
| M-11 | Returns | 1 | Credit note (sale return), debit note (purchase return), quantity validation against source |
| M-12 | Cash & Bank | 1 | Cash-in-hand, multiple bank accounts, deposits, withdrawals, transfers (cash↔bank, bank↔bank) |
| M-13 | Tax Engine | 1 | Nepal VAT (13%), configurable tax policies, tax-inclusive/exclusive, withholding/TDS foundations, PAN/VAT registration |
| M-14 | Document & PDF | 1 | Invoice themes, PDF preview/save/print/share, thermal printing, custom headers/terms/bank details |
| M-15 | Reports & Analytics | 1 | Dashboard, party reports, inventory reports, accounting reports, tax reports |
| M-16 | Import / Export | 1 | Excel/CSV import for parties/items, export transactions, data backup/restore |
| M-17 | Audit & Compliance | 1 | Immutable audit events, security logs, data retention |
| M-18 | Estimates & Quotations | 2 | Estimate/proforma, open/closed states, conversion to sale invoice |
| M-19 | Orders | 2 | Sale orders, purchase orders, fulfilment tracking, conversion to invoice/bill |
| M-20 | Delivery Challans | 2 | Delivery notes, goods return, conversion to sale, stock impact |
| M-21 | Batch & Serial Tracking | 2 | Batch/expiry, serial numbers, traceability |
| M-22 | Multi-Store Inventory | 2 | Multiple stores/godowns, per-store stock, stock transfers between stores |
| M-23 | Scheduled Reports & Reminders | 2 | Scheduled report delivery, payment reminders (SMS/WhatsApp/email) |
| M-24 | Custom Fields & Invoice Designer | 2 | User-defined fields per entity, drag-and-drop invoice template builder |
| M-25 | Manufacturing & BOM | 3 | Bill of materials, raw material tracking, manufacturing runs, finished goods, additional costs |
| M-26 | Fixed Assets | 3 | Asset register, acquisition, depreciation/appreciation, disposal |
| M-27 | Loyalty Program | 3 | Loyalty balance, earning/redemption rules, expiry, manual adjustment |
| M-28 | Online Catalogue & Store | 3 | Public product catalogue, custom domain, incoming orders |
| M-29 | Payment Links & Integrations | 3 | UPI/QR on invoices, payment link generation, third-party payment gateway |
| M-30 | Lending & Credit | 3 | Business loan application, credit line, bureau integration (post-compliance) |

### 2.2 Module Dependencies

```
M-01 (Auth) ← M-02 (Org) ← M-03 (Roles)
                 ↑
         M-04 (Parties)   M-05 (Items) ← M-06 (Inventory)
                 ↑              ↑
         M-07 (Sale) ────── M-13 (Tax)
         M-08 (Purchase) ── M-13 (Tax)
         M-09 (Payments)
         M-10 (Expense)
         M-11 (Returns) ── M-07/M-08
         M-12 (Cash/Bank) ← M-09
         M-14 (PDF) ← M-07
         M-15 (Reports) ← ALL transactional modules
         M-16 (Import) ← M-04, M-05
         M-17 (Audit) ← ALL modules
```

---

## 3. User Roles and Permissions

### 3.1 Role Definitions

| Role | Description | Default Access |
|---|---|---|
| **Owner** | Primary admin; created on company setup | Full access to all modules, settings, users, billing, exports, and subscription |
| **Admin** | Delegated operational admin | All transactions, reports, settings, user management (cannot delete org) |
| **Accountant** | Accounting specialist | Journal entries, corrections, tax reports, reconciliation, exports; business admin optionally restricted |
| **Billing Operator** | Day-to-day billing staff | Create/edit sales, payments, returns, parties, items; no cost/profit visibility by default |
| **Salesperson** | Field/counter sales | Assigned customer workflows, item availability, own sales only; no dashboard or sensitive reports |
| **Viewer / Auditor** | Read-only access | View selected modules and exports; no create/edit/delete |

### 3.2 Permission Model

Permissions follow the pattern: **`resource:action:scope`**

| Resource | Actions | Scopes |
|---|---|---|
| `sale` | `create`, `update`, `delete`, `post`, `reverse`, `view` | `own`, `any` |
| `purchase` | `create`, `update`, `delete`, `post`, `reverse`, `view` | `own`, `any` |
| `payment` | `create`, `update`, `delete`, `view` | `own`, `any` |
| `expense` | `create`, `update`, `delete`, `view` | `own`, `any` |
| `party` | `create`, `update`, `delete`, `view`, `import` | `any` |
| `item` | `create`, `update`, `delete`, `view`, `import`, `cost:view` | `any` |
| `inventory` | `adjust`, `transfer`, `view` | `any` |
| `report` | `pnl:view`, `balance_sheet:view`, `tax:view`, `stock:view`, `party:view`, `daybook:view` | `any` |
| `settings` | `company:update`, `tax:update`, `users:manage`, `roles:manage` | `any` |
| `audit` | `view`, `export` | `any` |
| `backup` | `create`, `restore`, `download` | `any` |

### 3.3 Default Role-Permission Matrix

| Permission | Owner | Admin | Accountant | Billing | Salesperson | Viewer |
|---|---|---|---|---|---|---|
| sale:create:any | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| sale:create:own | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| sale:post:any | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| sale:reverse:any | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| purchase:create:any | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| payment:create:any | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| item:cost:view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| report:pnl:view | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| settings:users:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| audit:view | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| backup:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.4 Enforcement Rules

- Permissions are enforced **server-side** on every API mutation and sensitive query.
- Custom roles can be created by owners by assembling permission sets.
- Role changes are immutably logged in the audit trail.
- A user may belong to multiple organizations with different roles in each.

---

## 4. Every Screen / Page

### 4.1 Route Map

```text
/                                      → Redirect to /app or /auth/login
/auth/login                            → Login (phone/email + OTP)
/auth/signup                           → Sign-up
/auth/forgot-password                  → Password recovery
/auth/verify-otp                       → OTP verification

/app/select-company                    → Company selector (multi-company)

/app/:companyId/dashboard              → Main dashboard
/app/:companyId/home                   → Home (recent txns, quick actions)

── Sales ──
/app/:companyId/sales/invoices                → Sale invoice list
/app/:companyId/sales/invoices/new            → New sale invoice
/app/:companyId/sales/invoices/:id            → Sale invoice detail
/app/:companyId/sales/invoices/:id/edit       → Edit draft invoice
/app/:companyId/sales/invoices/:id/pdf        → PDF preview/print
/app/:companyId/sales/estimates               → Estimate list (Phase 2)
/app/:companyId/sales/estimates/new           → New estimate (Phase 2)
/app/:companyId/sales/orders                  → Sale order list (Phase 2)
/app/:companyId/sales/orders/new              → New sale order (Phase 2)
/app/:companyId/sales/delivery-notes          → Delivery challan list (Phase 2)
/app/:companyId/sales/delivery-notes/new      → New delivery challan (Phase 2)
/app/:companyId/sales/credit-notes            → Credit note (sale return) list
/app/:companyId/sales/credit-notes/new        → New credit note

── Purchases ──
/app/:companyId/purchases/bills               → Purchase bill list
/app/:companyId/purchases/bills/new           → New purchase bill
/app/:companyId/purchases/bills/:id           → Purchase bill detail
/app/:companyId/purchases/orders              → Purchase order list (Phase 2)
/app/:companyId/purchases/debit-notes         → Debit note (purchase return) list
/app/:companyId/purchases/debit-notes/new     → New debit note

── Payments ──
/app/:companyId/payments/received             → Payments received list
/app/:companyId/payments/received/new         → New payment received
/app/:companyId/payments/made                 → Payments made list
/app/:companyId/payments/made/new             → New payment made

── Expenses & Income ──
/app/:companyId/expenses                      → Expense list
/app/:companyId/expenses/new                  → New expense
/app/:companyId/other-income                  → Other income list
/app/:companyId/other-income/new              → New other income

── Parties ──
/app/:companyId/parties                       → Party list (customers + suppliers)
/app/:companyId/parties/new                   → New party
/app/:companyId/parties/:partyId              → Party detail & statement
/app/:companyId/parties/:partyId/edit         → Edit party
/app/:companyId/parties/groups                → Party groups
/app/:companyId/parties/import                → Import parties

── Items & Inventory ──
/app/:companyId/items                         → Item/service list
/app/:companyId/items/new                     → New item/service
/app/:companyId/items/:itemId                 → Item detail & stock history
/app/:companyId/items/:itemId/edit            → Edit item
/app/:companyId/items/categories              → Item categories
/app/:companyId/items/import                  → Import items
/app/:companyId/inventory/adjustments         → Stock adjustments
/app/:companyId/inventory/adjustments/new     → New stock adjustment
/app/:companyId/inventory/transfers           → Stock transfers (Phase 2)
/app/:companyId/inventory/stores              → Store/godown management (Phase 2)

── Cash & Bank ──
/app/:companyId/accounts                      → Cash & bank account list
/app/:companyId/accounts/new                  → New bank account
/app/:companyId/accounts/:accountId           → Account detail & statement
/app/:companyId/accounts/transfer             → New transfer (cash↔bank, bank↔bank)
/app/:companyId/accounts/cheques              → Cheque list & status

── Reports ──
/app/:companyId/reports                       → Report index
/app/:companyId/reports/dashboard             → Dashboard analytics
/app/:companyId/reports/daybook               → Day book
/app/:companyId/reports/profit-loss           → Profit & Loss
/app/:companyId/reports/balance-sheet         → Balance Sheet
/app/:companyId/reports/cash-flow             → Cash Flow
/app/:companyId/reports/trial-balance         → Trial Balance
/app/:companyId/reports/party-statement       → Party statement
/app/:companyId/reports/receivable-payable    → Receivable / Payable aging
/app/:companyId/reports/sales                 → Sales report
/app/:companyId/reports/purchases             → Purchase report
/app/:companyId/reports/expenses              → Expense report
/app/:companyId/reports/stock-summary         → Stock summary
/app/:companyId/reports/stock-detail          → Stock detail
/app/:companyId/reports/item-wise-profit      → Item-wise profit
/app/:companyId/reports/party-wise-profit     → Party-wise profit
/app/:companyId/reports/tax-report            → Tax (VAT) report
/app/:companyId/reports/tds                   → TDS report (Phase 2)

── Settings ──
/app/:companyId/settings                      → Settings index
/app/:companyId/settings/company              → Company profile & tax setup
/app/:companyId/settings/firms                → Firms/branches
/app/:companyId/settings/fiscal-years         → Fiscal year management
/app/:companyId/settings/taxes                → Tax policies & rates
/app/:companyId/settings/units                → Units of measurement
/app/:companyId/settings/document-sequences   → Document number prefixes
/app/:companyId/settings/invoice-templates    → Invoice themes & design
/app/:companyId/settings/users                → User management
/app/:companyId/settings/roles                → Role & permission management
/app/:companyId/settings/import-export        → Import/export center
/app/:companyId/settings/backup               → Backup & restore

── Audit ──
/app/:companyId/audit                         → Audit event log
/app/:companyId/audit/:eventId                → Audit event detail
```

### 4.2 Navigation Layout

**Desktop**: Collapsible left sidebar with all primary groups + global create button (top-right) + company selector (top-left) + search bar (top-center).

**Mobile (< 768px)**: Bottom navigation bar with **Home**, **Dashboard**, **Items**, **More**. Floating action button for contextual create. All other sections accessible via the "More" drawer.

---

## 5. Business Workflows

### 5.1 First-Run Setup

```
1. Create account → phone/email + OTP verification
2. Create company → name, country (Nepal), currency (NPR), timezone (Asia/Kathmandu)
3. Set fiscal year → Nepali fiscal year dates
4. Tax registration → PAN number, VAT status (registered/unregistered)
5. Choose enabled features → inventory, estimates, orders, batches (progressive)
6. Add opening data → cash/bank balance, first party, first item OR import
7. Create first invoice → preview PDF → confirm setup complete
```

> Setup must be resumable. Optional steps never block the first invoice.

### 5.2 Sale Invoice Posting

```
1. User selects firm, customer (or cash sale), invoice date
2. System assigns next document number from sequence
3. User adds line items: item → qty → unit → rate → discount → tax
4. Server calculates: line amounts → discounts → taxable base → tax → charges → round-off → total
5. User records payment received (full/partial/none) → selects cash/bank account
6. User clicks "Post"
7. Server validates:
   ├── Organization, firm, fiscal year, user permissions
   ├── Document sequence uniqueness
   ├── Item stock availability (if enforced)
   ├── Customer credit limit (if enforced)
   └── Calculation integrity (server recomputes all totals)
8. In ONE atomic database transaction:
   ├── Create receivable (debit customer A/R) or debit cash/bank
   ├── Create revenue credits (credit sales revenue)
   ├── Create tax credits (credit VAT payable)
   ├── Create stock-out movements (reduce inventory)
   ├── Create cost-of-goods entries (debit COGS, credit inventory)
   ├── Create payment allocations (if paid)
   ├── Create immutable audit event
   └── Create outbox event (for PDF generation, notifications)
9. If any step fails → entire posting rolls back
10. Async: generate PDF, send notification if configured
```

### 5.3 Purchase Bill Posting

```
1. User selects supplier, bill date, bill number
2. User adds line items with quantities, rates, taxes
3. Server recomputes totals
4. On post (atomic):
   ├── Debit inventory/expense/asset accounts
   ├── Debit recoverable VAT (if registered)
   ├── Credit supplier payable or cash/bank
   ├── Create stock-in movements for stock-controlled items
   ├── Create audit event + outbox event
```

### 5.4 Payment Receipt

```
1. Select party → system shows outstanding invoices
2. Enter amount, date, payment mode, cash/bank account
3. Optionally allocate to specific invoices or mark as advance
4. On post:
   ├── Debit cash/bank account
   ├── Credit party receivable account
   ├── Update payment allocations on target invoices
   ├── Refresh aging/outstanding calculations
```

### 5.5 Payment Made

```
1. Select supplier → system shows outstanding bills
2. Enter amount, date, payment mode, cash/bank account
3. Allocate to bills or record as advance
4. On post:
   ├── Debit supplier payable account
   ├── Credit cash/bank account
   ├── Update payment allocations
```

### 5.6 Sale Return / Credit Note

```
1. Reference original sale invoice (optional but recommended)
2. Select eligible lines and return quantities
3. System validates: return qty ≤ remaining eligible qty (incl. free qty)
4. On post:
   ├── Reverse revenue (debit revenue, credit return account)
   ├── Reverse tax (debit VAT payable)
   ├── Create stock-in movements (return to inventory)
   ├── Reverse COGS
   ├── Debit customer balance or issue refund/credit
   ├── Create document link to original invoice
```

### 5.7 Purchase Return / Debit Note

```
1. Reference original purchase bill
2. Select eligible lines and return quantities
3. On post:
   ├── Reverse inventory/expense entries
   ├── Reverse recoverable VAT
   ├── Credit supplier payable
   ├── Create stock-out movements
   ├── Create document link
```

### 5.8 Bank Transfer

```
1. Select source account, destination account
2. Enter amount, date, reference
3. On post:
   ├── Debit destination account
   ├── Credit source account
   ├── Audit trail entry
```

### 5.9 Expense Recording

```
1. Select expense category, date, amount
2. Optionally link to party (supplier)
3. Select payment mode (cash/bank)
4. On post:
   ├── Debit expense account
   ├── Credit cash/bank
   ├── Create audit event
```

### 5.10 Document Reversal

```
1. Select posted document → click "Reverse"
2. Enter reason for reversal
3. On post:
   ├── Create compensating journal entries (mirror of original)
   ├── Create compensating stock movements
   ├── Unallocate associated payments
   ├── Mark original document as "Reversed"
   ├── Create new reversal document linked to original
   ├── Preserve original document — never delete
```

### 5.11 Estimate → Sale Order → Invoice Conversion (Phase 2)

```
Estimate (draft → open → converted/closed/cancelled)
   ↓ convert
Sale Order (draft → open → partially_fulfilled → fulfilled/closed)
   ↓ convert (full or partial)
Sale Invoice (draft → posted → paid)
   ↓ convert (optional)
Delivery Challan (draft → issued → returned/invoiced/closed)
```

Each conversion creates a `document_link` preserving the chain. Partial conversions track remaining quantities.

---

## 6. Database Schema — MongoDB

### 6.1 Design Principles

- Every tenant-owned document includes `organizationId`.
- Financial mutations include `createdBy`, `createdAt`, `updatedBy`, `updatedAt`, and a `version` field for optimistic concurrency.
- Posted financial documents are immutable; corrections create new documents.
- Money fields use `Decimal128` — never floating point.
- Audit events are append-only.
- Idempotency keys prevent duplicate financial operations.

### 6.2 Collection Schemas

#### 6.2.1 Tenant & Access

```javascript
// organizations
{
  _id: ObjectId,
  name: String,
  country: "NP",
  currency: "NPR",
  timezone: "Asia/Kathmandu",
  logo: String,               // URL to stored logo
  taxRegistration: {
    type: "PAN" | "VAT",
    number: String,            // 9-digit PAN
    registeredDate: Date
  },
  settings: {
    fiscalYearStart: { month: Number, day: Number },
    defaultLanguage: "en" | "ne" | "bilingual",
    calendarDisplay: "gregorian" | "bikram_sambat" | "both",
    negativeStockAllowed: Boolean,
    decimalPlaces: Number,     // default 2
    roundOffEnabled: Boolean,
    roundOffMethod: "nearest" | "up" | "down"
  },
  enabledFeatures: [String],   // ["inventory","estimates","orders","batches","multi_store"]
  subscription: {
    plan: String,
    validUntil: Date
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// firms
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,
  address: {
    line1: String, line2: String,
    city: String, district: String, province: String,
    country: "NP", postalCode: String
  },
  phone: String,
  email: String,
  taxIdentity: { type: String, number: String },
  logo: String,
  signature: String,
  bankDetails: [{
    bankName: String, branch: String,
    accountName: String, accountNumber: String,
    swiftCode: String
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// financial_years
{
  _id: ObjectId,
  organizationId: ObjectId,
  label: String,               // "2082/83 BS" or "2025/26"
  startDate: Date,             // Gregorian
  endDate: Date,               // Gregorian
  bsStartDate: String,         // "2082-04-01" (Shrawan 1)
  bsEndDate: String,           // "2083-03-31" (Ashad end)
  isClosed: Boolean,
  closedAt: Date,
  closedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// users
{
  _id: ObjectId,
  fullName: String,
  phone: String,
  email: String,
  passwordHash: String,
  mfaEnabled: Boolean,
  mfaSecret: String,
  avatar: String,
  lastLoginAt: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// company_users
{
  _id: ObjectId,
  organizationId: ObjectId,
  userId: ObjectId,
  roleId: ObjectId,
  invitedBy: ObjectId,
  invitedAt: Date,
  acceptedAt: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// roles
{
  _id: ObjectId,
  organizationId: ObjectId,    // null for system defaults
  name: String,                // "owner", "admin", "accountant", "billing", "salesperson", "viewer"
  isSystem: Boolean,
  permissions: [String],       // ["sale:create:any", "sale:post:any", "report:pnl:view"]
  createdAt: Date,
  updatedAt: Date
}
```

#### 6.2.2 Masters

```javascript
// parties
{
  _id: ObjectId,
  organizationId: ObjectId,
  type: "customer" | "supplier" | "both",
  name: String,
  phone: String,
  email: String,
  billingAddress: {
    line1: String, line2: String,
    city: String, district: String, province: String,
    country: String, postalCode: String
  },
  shippingAddress: { /* same structure */ },
  taxIdentity: {
    panNumber: String,
    vatNumber: String
  },
  openingBalance: {
    amount: Decimal128,        // positive = receivable, negative = payable
    asOfDate: Date
  },
  creditLimit: Decimal128,
  creditLimitEnabled: Boolean,
  groupIds: [ObjectId],
  customFields: { /* dynamic key-value */ },
  notes: String,
  isActive: Boolean,
  version: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date
}

// party_groups
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}

// items
{
  _id: ObjectId,
  organizationId: ObjectId,
  type: "product" | "service",
  name: String,
  code: String,                // SKU
  barcode: String,
  description: String,
  categoryId: ObjectId,
  primaryUnitId: ObjectId,
  secondaryUnitId: ObjectId,
  conversionFactor: Decimal128, // secondary per primary
  hsnSacCode: String,
  taxPolicyId: ObjectId,
  salePrice: Decimal128,
  purchasePrice: Decimal128,
  mrp: Decimal128,
  defaultDiscount: { type: "percentage" | "amount", value: Decimal128 },
  isStockTracked: Boolean,     // false for services
  openingStock: {
    quantity: Decimal128,
    rate: Decimal128,
    amount: Decimal128,
    asOfDate: Date,
    storeId: ObjectId
  },
  minimumStock: Decimal128,
  images: [String],
  customFields: { /* dynamic */ },
  isActive: Boolean,
  version: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date
}

// item_categories
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,
  parentCategoryId: ObjectId,  // for hierarchy
  createdAt: Date,
  updatedAt: Date
}

// units
{
  _id: ObjectId,
  organizationId: ObjectId,    // null for system units (PCS, KG, LTR, etc.)
  name: String,
  abbreviation: String,
  isSystem: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// unit_conversions
{
  _id: ObjectId,
  organizationId: ObjectId,
  fromUnitId: ObjectId,
  toUnitId: ObjectId,
  factor: Decimal128,          // 1 fromUnit = factor toUnit
  createdAt: Date,
  updatedAt: Date
}
```

#### 6.2.3 Tax

```javascript
// tax_policies
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,                // "Nepal VAT 13%", "Exempt", "Zero-Rated"
  jurisdiction: "NP",
  taxType: "VAT" | "EXCISE" | "TDS" | "CUSTOM",
  components: [{
    name: String,              // "VAT"
    rate: Decimal128,          // 13.00
    applicableOn: "sale" | "purchase" | "both",
    isInclusive: Boolean,      // tax-inclusive pricing
    accountId: ObjectId        // VAT payable / recoverable account
  }],
  hsnSacCodes: [String],
  effectiveFrom: Date,
  effectiveTo: Date,           // null if current
  version: Number,             // policy version for historical reference
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// withholding_rules
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,                // "TDS on Rent 10%"
  type: "TDS" | "TCS",
  rate: Decimal128,
  threshold: Decimal128,       // minimum amount before withholding applies
  applicableTransactionTypes: [String],
  accountId: ObjectId,         // TDS payable account
  effectiveFrom: Date,
  effectiveTo: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6.2.4 Documents & Transactions

```javascript
// transactions
{
  _id: ObjectId,
  organizationId: ObjectId,
  firmId: ObjectId,
  financialYearId: ObjectId,
  type: "sale_invoice" | "purchase_bill" | "payment_in" | "payment_out" |
        "expense" | "other_income" | "credit_note" | "debit_note" |
        "estimate" | "sale_order" | "purchase_order" | "delivery_challan" |
        "bank_transfer" | "stock_adjustment" | "stock_transfer" |
        "journal_entry",
  status: "draft" | "posted" | "partially_paid" | "paid" | "overdue" |
          "reversed" | "voided" |
          "open" | "partially_converted" | "converted" | "closed" | "cancelled",
  documentNumber: String,      // "INV-2082/83-0001"
  sequenceId: ObjectId,
  date: Date,                  // transaction date (Gregorian)
  bsDate: String,              // Bikram Sambat display: "2082-05-15"
  dueDate: Date,
  partyId: ObjectId,
  partyName: String,           // denormalized snapshot
  isCashTransaction: Boolean,  // cash sale (no party ledger)
  lines: [{
    _id: ObjectId,
    itemId: ObjectId,
    itemName: String,          // snapshot
    itemCode: String,          // snapshot
    description: String,
    hsnSacCode: String,
    storeId: ObjectId,
    quantity: Decimal128,
    freeQuantity: Decimal128,
    unitId: ObjectId,
    unitName: String,
    conversionFactor: Decimal128,
    baseQuantity: Decimal128,  // quantity in primary unit
    rate: Decimal128,
    grossAmount: Decimal128,   // qty × rate
    discount: {
      type: "percentage" | "amount",
      value: Decimal128,
      amount: Decimal128       // calculated discount amount
    },
    taxableAmount: Decimal128,
    taxes: [{
      taxPolicyId: ObjectId,
      taxPolicyVersion: Number,
      componentName: String,   // "VAT"
      rate: Decimal128,
      amount: Decimal128,
      accountId: ObjectId
    }],
    totalTax: Decimal128,
    lineTotal: Decimal128,
    batchId: ObjectId,         // Phase 2
    serialNumbers: [String],   // Phase 2
    customFields: {}
  }],
  subtotal: Decimal128,        // sum of line grossAmounts after discounts
  documentDiscount: {
    type: "percentage" | "amount",
    value: Decimal128,
    amount: Decimal128
  },
  additionalCharges: [{
    name: String,              // "Shipping", "Packing"
    amount: Decimal128,
    taxPolicyId: ObjectId,
    taxAmount: Decimal128
  }],
  totalTaxableAmount: Decimal128,
  totalTax: Decimal128,
  taxBreakdown: [{
    componentName: String,
    rate: Decimal128,
    taxableAmount: Decimal128,
    taxAmount: Decimal128
  }],
  withholding: {
    ruleId: ObjectId,
    rate: Decimal128,
    amount: Decimal128
  },
  roundOff: Decimal128,
  grandTotal: Decimal128,
  paidAmount: Decimal128,
  balanceDue: Decimal128,
  payments: [{
    amount: Decimal128,
    mode: "cash" | "bank_transfer" | "cheque" | "upi" | "card" | "other",
    accountId: ObjectId,
    reference: String,
    chequeNumber: String,
    chequeDate: Date
  }],
  notes: String,
  termsAndConditions: String,
  shippingDetails: {
    address: {},
    transportName: String,
    vehicleNumber: String,
    lrNumber: String
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: Date
  }],
  linkedDocuments: [{
    transactionId: ObjectId,
    type: String,              // "source_invoice", "credit_note", "converted_from"
    documentNumber: String
  }],
  pdfUrl: String,
  printCount: Number,
  calculationSnapshot: {
    taxPolicyVersions: {},     // preserve original tax rates
    roundingMethod: String,
    calculatedAt: Date
  },
  reversalReason: String,
  reversedAt: Date,
  reversedBy: ObjectId,
  idempotencyKey: String,
  version: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date
}

// document_sequences
{
  _id: ObjectId,
  organizationId: ObjectId,
  firmId: ObjectId,
  financialYearId: ObjectId,
  transactionType: String,
  prefix: String,              // "INV-"
  nextNumber: Number,
  format: String,              // "{prefix}{fy}-{number:04d}"
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
// Note: nextNumber incremented atomically using findOneAndUpdate
// to prevent duplicate sequence numbers under concurrency.
```

#### 6.2.5 Accounting

```javascript
// accounts (Chart of Accounts)
{
  _id: ObjectId,
  organizationId: ObjectId,
  code: String,                // "1000", "2100", "4000"
  name: String,                // "Cash", "Accounts Receivable", "Sales Revenue"
  type: "asset" | "liability" | "equity" | "revenue" | "expense",
  subType: String,             // "current_asset", "fixed_asset", "cost_of_goods", etc.
  parentAccountId: ObjectId,   // for hierarchy
  isSystem: Boolean,           // system accounts cannot be deleted
  isCashOrBank: Boolean,
  openingBalance: Decimal128,
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// journal_entries
{
  _id: ObjectId,
  organizationId: ObjectId,
  transactionId: ObjectId,     // link to source transaction
  date: Date,
  narration: String,
  lines: [{
    accountId: ObjectId,
    accountName: String,       // snapshot
    debit: Decimal128,         // one of debit/credit is 0
    credit: Decimal128,
    partyId: ObjectId,
    description: String
  }],
  totalDebit: Decimal128,      // must equal totalCredit
  totalCredit: Decimal128,
  isReversal: Boolean,
  reversalOfId: ObjectId,
  createdBy: ObjectId,
  createdAt: Date
}
// Invariant: sum(debit) === sum(credit) for every journal entry.

// payment_allocations
{
  _id: ObjectId,
  organizationId: ObjectId,
  paymentTransactionId: ObjectId,  // the receipt/payment document
  invoiceTransactionId: ObjectId,  // the invoice/bill being settled
  amount: Decimal128,
  allocatedAt: Date,
  allocatedBy: ObjectId,
  isActive: Boolean,           // false if reversed
  createdAt: Date,
  updatedAt: Date
}
// Invariant: sum(allocations) for an invoice ≤ invoice grandTotal
// unless overpayment/advance is explicitly modeled.

// cash_bank_accounts
{
  _id: ObjectId,
  organizationId: ObjectId,
  accountId: ObjectId,         // link to chart of accounts
  type: "cash" | "bank",
  name: String,                // "Cash in Hand", "NIC Asia - Main"
  bankName: String,
  branchName: String,
  accountNumber: String,
  openingBalance: Decimal128,
  currentBalance: Decimal128,  // maintained via transactions
  isDefault: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// cheques
{
  _id: ObjectId,
  organizationId: ObjectId,
  transactionId: ObjectId,
  bankAccountId: ObjectId,
  chequeNumber: String,
  chequeDate: Date,
  amount: Decimal128,
  partyId: ObjectId,
  status: "pending" | "cleared" | "bounced" | "cancelled",
  clearedAt: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6.2.6 Inventory

```javascript
// stores
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,                // "Main Warehouse", "Shop Floor"
  address: {},
  isDefault: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// stock_movements
{
  _id: ObjectId,
  organizationId: ObjectId,
  transactionId: ObjectId,     // source transaction
  transactionLineId: ObjectId,
  itemId: ObjectId,
  storeId: ObjectId,
  type: "in" | "out" | "adjustment" | "transfer_in" | "transfer_out",
  quantity: Decimal128,        // always positive; direction indicated by type
  unitId: ObjectId,
  baseQuantity: Decimal128,    // quantity in primary unit
  rate: Decimal128,            // cost per unit
  amount: Decimal128,          // total cost
  batchId: ObjectId,           // Phase 2
  serialNumbers: [String],    // Phase 2
  referenceType: String,       // "sale", "purchase", "return", "adjustment", "transfer"
  date: Date,
  createdBy: ObjectId,
  createdAt: Date
}

// stock_balances (materialized/cached projection)
{
  _id: ObjectId,
  organizationId: ObjectId,
  itemId: ObjectId,
  storeId: ObjectId,
  currentQuantity: Decimal128,
  currentValue: Decimal128,
  lastMovementAt: Date,
  updatedAt: Date
}
// Rebuilt from stock_movements. Used for fast queries; source of truth is movements.
```

#### 6.2.7 Operations

```javascript
// audit_events (append-only)
{
  _id: ObjectId,
  organizationId: ObjectId,
  userId: ObjectId,
  userName: String,
  action: String,              // "transaction.posted", "party.updated", "user.role_changed", "login.success"
  resourceType: String,        // "transaction", "party", "item", "user", "settings"
  resourceId: ObjectId,
  details: {
    before: {},                // snapshot before change
    after: {},                 // snapshot after change
    metadata: {}               // additional context
  },
  ipAddress: String,
  userAgent: String,
  correlationId: String,       // request trace ID
  timestamp: Date
}
// Index: { organizationId: 1, timestamp: -1 }
// Index: { organizationId: 1, resourceType: 1, resourceId: 1 }

// idempotency_keys
{
  _id: ObjectId,
  organizationId: ObjectId,
  key: String,                 // client-supplied UUID
  endpoint: String,
  method: String,
  responseStatus: Number,
  responseBody: {},
  createdAt: Date,
  expiresAt: Date              // TTL index; keys expire after 24-48 hours
}

// outbox_events
{
  _id: ObjectId,
  organizationId: ObjectId,
  eventType: String,           // "invoice.posted", "payment.received"
  payload: {},
  status: "pending" | "processing" | "completed" | "failed",
  retryCount: Number,
  processedAt: Date,
  createdAt: Date
}
// Used for async side-effects: PDF generation, notifications, webhooks.

// import_jobs
{
  _id: ObjectId,
  organizationId: ObjectId,
  type: "parties" | "items" | "transactions",
  fileName: String,
  fileUrl: String,
  status: "uploaded" | "validating" | "preview" | "importing" | "completed" | "failed",
  totalRows: Number,
  validRows: Number,
  errorRows: Number,
  errors: [{
    row: Number,
    field: String,
    message: String
  }],
  idempotencyKey: String,
  createdBy: ObjectId,
  createdAt: Date,
  completedAt: Date
}

// report_schedules (Phase 2)
{
  _id: ObjectId,
  organizationId: ObjectId,
  reportKey: String,
  filters: {},
  frequency: "daily" | "weekly" | "monthly",
  deliveryMethod: "email" | "whatsapp",
  recipients: [String],
  lastRunAt: Date,
  nextRunAt: Date,
  isActive: Boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.3 Index Strategy

| Collection | Key Indexes |
|---|---|
| `transactions` | `{ organizationId, type, status, date }`, `{ organizationId, partyId, date }`, `{ organizationId, documentNumber }` (unique), `{ idempotencyKey }` (unique sparse) |
| `journal_entries` | `{ organizationId, date }`, `{ organizationId, transactionId }`, `{ "lines.accountId", organizationId, date }` |
| `stock_movements` | `{ organizationId, itemId, storeId, date }`, `{ transactionId }` |
| `stock_balances` | `{ organizationId, itemId, storeId }` (unique) |
| `parties` | `{ organizationId, name }`, `{ organizationId, phone }`, `{ organizationId, "taxIdentity.panNumber" }` |
| `items` | `{ organizationId, name }`, `{ organizationId, code }`, `{ organizationId, barcode }` |
| `audit_events` | `{ organizationId, timestamp }`, `{ organizationId, resourceType, resourceId }` |
| `payment_allocations` | `{ organizationId, invoiceTransactionId }`, `{ paymentTransactionId }` |
| `idempotency_keys` | `{ key }` (unique), `{ expiresAt }` (TTL) |

---

## 7. Backend API List

### 7.1 API Design Rules

- Base URL: `/api/v1`
- All organization-scoped routes prefixed: `/api/v1/organizations/:orgId/...`
- Require `Idempotency-Key` header on all financial creates and posting requests.
- Return field-level validation errors with stable machine-readable error codes.
- Use cursor-based pagination for all list endpoints.
- Every request authenticated via JWT; organization authorization enforced server-side.
- Large outputs (PDFs, exports, reports) generated as background jobs.

### 7.2 Complete Endpoint List

#### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | Create account (phone/email + password) |
| `POST` | `/api/v1/auth/login` | Login (returns JWT) |
| `POST` | `/api/v1/auth/otp/request` | Request OTP for verification |
| `POST` | `/api/v1/auth/otp/verify` | Verify OTP |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Invalidate session |
| `POST` | `/api/v1/auth/forgot-password` | Initiate password reset |
| `POST` | `/api/v1/auth/reset-password` | Complete password reset |
| `GET` | `/api/v1/auth/me` | Get current user profile |
| `PATCH` | `/api/v1/auth/me` | Update current user profile |

#### Organizations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations` | List user's organizations |
| `POST` | `/api/v1/organizations` | Create organization |
| `GET` | `/api/v1/organizations/:orgId` | Get organization details |
| `PATCH` | `/api/v1/organizations/:orgId` | Update organization settings |
| `DELETE` | `/api/v1/organizations/:orgId` | Deactivate organization |

#### Firms

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/firms` | List firms |
| `POST` | `/api/v1/organizations/:orgId/firms` | Create firm |
| `GET` | `/api/v1/organizations/:orgId/firms/:firmId` | Get firm details |
| `PATCH` | `/api/v1/organizations/:orgId/firms/:firmId` | Update firm |

#### Financial Years

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/financial-years` | List fiscal years |
| `POST` | `/api/v1/organizations/:orgId/financial-years` | Create fiscal year |
| `PATCH` | `/api/v1/organizations/:orgId/financial-years/:fyId` | Update / close fiscal year |

#### Users & Roles

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/users` | List organization users |
| `POST` | `/api/v1/organizations/:orgId/users/invite` | Invite user |
| `PATCH` | `/api/v1/organizations/:orgId/users/:userId` | Update user role / deactivate |
| `DELETE` | `/api/v1/organizations/:orgId/users/:userId` | Remove user from org |
| `GET` | `/api/v1/organizations/:orgId/roles` | List roles |
| `POST` | `/api/v1/organizations/:orgId/roles` | Create custom role |
| `PATCH` | `/api/v1/organizations/:orgId/roles/:roleId` | Update role permissions |
| `DELETE` | `/api/v1/organizations/:orgId/roles/:roleId` | Delete custom role |

#### Parties

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/parties` | List parties (filter by type, group, search) |
| `POST` | `/api/v1/organizations/:orgId/parties` | Create party |
| `GET` | `/api/v1/organizations/:orgId/parties/:partyId` | Get party details |
| `PATCH` | `/api/v1/organizations/:orgId/parties/:partyId` | Update party |
| `DELETE` | `/api/v1/organizations/:orgId/parties/:partyId` | Soft-delete party |
| `GET` | `/api/v1/organizations/:orgId/parties/:partyId/statement` | Get party ledger statement |
| `GET` | `/api/v1/organizations/:orgId/parties/:partyId/transactions` | Party transaction history |
| `GET` | `/api/v1/organizations/:orgId/party-groups` | List party groups |
| `POST` | `/api/v1/organizations/:orgId/party-groups` | Create party group |
| `PATCH` | `/api/v1/organizations/:orgId/party-groups/:groupId` | Update party group |
| `DELETE` | `/api/v1/organizations/:orgId/party-groups/:groupId` | Delete party group |

#### Items & Categories

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/items` | List items (filter by type, category, search) |
| `POST` | `/api/v1/organizations/:orgId/items` | Create item/service |
| `GET` | `/api/v1/organizations/:orgId/items/:itemId` | Get item details + stock |
| `PATCH` | `/api/v1/organizations/:orgId/items/:itemId` | Update item |
| `DELETE` | `/api/v1/organizations/:orgId/items/:itemId` | Soft-delete item |
| `GET` | `/api/v1/organizations/:orgId/items/:itemId/stock-history` | Item stock movement history |
| `GET` | `/api/v1/organizations/:orgId/item-categories` | List categories |
| `POST` | `/api/v1/organizations/:orgId/item-categories` | Create category |
| `PATCH` | `/api/v1/organizations/:orgId/item-categories/:catId` | Update category |
| `DELETE` | `/api/v1/organizations/:orgId/item-categories/:catId` | Delete category |
| `GET` | `/api/v1/organizations/:orgId/units` | List units |
| `POST` | `/api/v1/organizations/:orgId/units` | Create custom unit |

#### Transactions (Unified)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/transactions` | List transactions (filter by type, status, date, party) |
| `POST` | `/api/v1/organizations/:orgId/transactions` | Create transaction (any type) — requires `Idempotency-Key` |
| `GET` | `/api/v1/organizations/:orgId/transactions/:txnId` | Get transaction detail |
| `PATCH` | `/api/v1/organizations/:orgId/transactions/:txnId` | Update draft transaction |
| `DELETE` | `/api/v1/organizations/:orgId/transactions/:txnId` | Delete draft transaction |
| `POST` | `/api/v1/organizations/:orgId/transactions/:txnId/post` | Post transaction — requires `Idempotency-Key` |
| `POST` | `/api/v1/organizations/:orgId/transactions/:txnId/reverse` | Reverse posted transaction |
| `POST` | `/api/v1/organizations/:orgId/transactions/:txnId/convert` | Convert estimate→order→invoice (Phase 2) |
| `GET` | `/api/v1/organizations/:orgId/transactions/:txnId/pdf` | Get/generate PDF |
| `POST` | `/api/v1/organizations/:orgId/transactions/:txnId/share` | Generate share link |
| `GET` | `/api/v1/organizations/:orgId/transactions/:txnId/journal` | Get journal entries for transaction |

#### Payments & Allocations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/organizations/:orgId/payments` | Create payment (receipt or payment made) — requires `Idempotency-Key` |
| `GET` | `/api/v1/organizations/:orgId/payments/:payId` | Get payment detail |
| `POST` | `/api/v1/organizations/:orgId/payments/:payId/allocate` | Allocate payment to invoices |
| `DELETE` | `/api/v1/organizations/:orgId/payments/:payId/allocations/:allocId` | Unallocate |

#### Cash & Bank

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/accounts` | List cash/bank accounts |
| `POST` | `/api/v1/organizations/:orgId/accounts` | Create bank account |
| `GET` | `/api/v1/organizations/:orgId/accounts/:accId` | Account detail + statement |
| `PATCH` | `/api/v1/organizations/:orgId/accounts/:accId` | Update account |
| `POST` | `/api/v1/organizations/:orgId/accounts/transfer` | Transfer between accounts |
| `GET` | `/api/v1/organizations/:orgId/cheques` | List cheques |
| `PATCH` | `/api/v1/organizations/:orgId/cheques/:chequeId` | Update cheque status |

#### Inventory

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/organizations/:orgId/inventory/adjustments` | Stock adjustment |
| `POST` | `/api/v1/organizations/:orgId/inventory/transfers` | Stock transfer (Phase 2) |
| `GET` | `/api/v1/organizations/:orgId/stores` | List stores (Phase 2) |
| `POST` | `/api/v1/organizations/:orgId/stores` | Create store (Phase 2) |

#### Tax

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/tax-policies` | List tax policies |
| `POST` | `/api/v1/organizations/:orgId/tax-policies` | Create tax policy |
| `PATCH` | `/api/v1/organizations/:orgId/tax-policies/:policyId` | Update tax policy (creates new version) |
| `GET` | `/api/v1/organizations/:orgId/withholding-rules` | List withholding/TDS rules |
| `POST` | `/api/v1/organizations/:orgId/withholding-rules` | Create withholding rule |

#### Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/reports/dashboard` | Dashboard summary |
| `GET` | `/api/v1/organizations/:orgId/reports/daybook` | Day book |
| `GET` | `/api/v1/organizations/:orgId/reports/profit-loss` | Profit & Loss |
| `GET` | `/api/v1/organizations/:orgId/reports/balance-sheet` | Balance Sheet |
| `GET` | `/api/v1/organizations/:orgId/reports/cash-flow` | Cash Flow Statement |
| `GET` | `/api/v1/organizations/:orgId/reports/trial-balance` | Trial Balance |
| `GET` | `/api/v1/organizations/:orgId/reports/receivable-payable` | Receivable / Payable aging |
| `GET` | `/api/v1/organizations/:orgId/reports/party-statement/:partyId` | Party statement |
| `GET` | `/api/v1/organizations/:orgId/reports/sales` | Sales report |
| `GET` | `/api/v1/organizations/:orgId/reports/purchases` | Purchase report |
| `GET` | `/api/v1/organizations/:orgId/reports/expenses` | Expense report |
| `GET` | `/api/v1/organizations/:orgId/reports/stock-summary` | Stock summary |
| `GET` | `/api/v1/organizations/:orgId/reports/stock-detail/:itemId` | Stock detail per item |
| `GET` | `/api/v1/organizations/:orgId/reports/item-wise-profit` | Item-wise profit/loss |
| `GET` | `/api/v1/organizations/:orgId/reports/party-wise-profit` | Party-wise profit/loss |
| `GET` | `/api/v1/organizations/:orgId/reports/tax-report` | VAT report |
| `GET` | `/api/v1/organizations/:orgId/reports/tds` | TDS report (Phase 2) |
| `POST` | `/api/v1/organizations/:orgId/reports/export` | Export report as PDF/Excel (async job) |

#### Import / Export

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/organizations/:orgId/imports` | Upload file for import |
| `GET` | `/api/v1/organizations/:orgId/imports/:importId` | Get import status / preview |
| `POST` | `/api/v1/organizations/:orgId/imports/:importId/confirm` | Confirm and execute import |
| `POST` | `/api/v1/organizations/:orgId/exports` | Request data export (async) |
| `GET` | `/api/v1/organizations/:orgId/exports/:exportId` | Get export status / download |

#### Audit

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/audit-events` | List audit events (filtered, paginated) |
| `GET` | `/api/v1/organizations/:orgId/audit-events/:eventId` | Get audit event detail |

#### Document Sequences

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/document-sequences` | List sequences |
| `POST` | `/api/v1/organizations/:orgId/document-sequences` | Create sequence |
| `PATCH` | `/api/v1/organizations/:orgId/document-sequences/:seqId` | Update sequence prefix/format |

#### Settings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations/:orgId/settings` | Get all settings |
| `PATCH` | `/api/v1/organizations/:orgId/settings` | Update settings |
| `POST` | `/api/v1/organizations/:orgId/settings/logo` | Upload company logo |
| `POST` | `/api/v1/organizations/:orgId/settings/signature` | Upload signature image |

---

## 8. Frontend Components

### 8.1 Layout Components

| Component | Description |
|---|---|
| `AppShell` | Root layout: sidebar + topbar + content area |
| `Sidebar` | Collapsible left navigation with grouped menu items |
| `TopBar` | Company selector, search bar, create button, notifications, user menu |
| `BottomNav` | Mobile bottom navigation (Home, Dashboard, Items, More) |
| `PageContainer` | Standard page wrapper with breadcrumbs, title, action buttons |
| `ModalDialog` | Reusable modal overlay for forms, confirmations, detail views |
| `DrawerPanel` | Slide-in drawer for secondary content (filters, details) |

### 8.2 Data Display Components

| Component | Description |
|---|---|
| `DataTable` | Sortable, filterable, paginated table with row selection, inline actions |
| `DataCard` | Card-based list view for mobile-friendly displays |
| `StatCard` | Dashboard metric card (value, label, trend indicator, icon) |
| `ChartPanel` | Wrapper for chart types (bar, line, pie, donut) with date range selectors |
| `EmptyState` | Illustrated empty state with call-to-action |
| `LoadingSkeleton` | Skeleton placeholder while data loads |
| `InfiniteScroll` | Cursor-based infinite scroll for long lists |
| `Timeline` | Vertical timeline for audit events, transaction history |

### 8.3 Form Components

| Component | Description |
|---|---|
| `FormField` | Unified form control (label, input, validation, help text) |
| `TextInput` | Standard text input with validation states |
| `NumberInput` | Numeric input with decimal precision, min/max, step |
| `MoneyInput` | Currency-aware input: NPR symbol, Decimal128 precision, comma formatting |
| `DatePicker` | Dual-mode date picker: Gregorian + Bikram Sambat toggle |
| `BSDatePicker` | Bikram Sambat calendar picker with BS↔AD conversion |
| `SelectDropdown` | Searchable select with single/multi mode |
| `PartySelect` | Party picker with search, quick-create, balance preview |
| `ItemSelect` | Item picker with search, barcode scan, stock/price preview |
| `AccountSelect` | Cash/bank account picker with balance preview |
| `FileUpload` | Drag-and-drop file upload for attachments, imports, logos |
| `TagInput` | Multi-value tag/chip input |
| `Toggle` | Boolean toggle switch |
| `RadioGroup` | Radio button group |
| `CheckboxGroup` | Checkbox group |
| `TextArea` | Multi-line text input |
| `SearchInput` | Global search with debounce, keyboard shortcuts |

### 8.4 Transaction Components

| Component | Description |
|---|---|
| `TransactionForm` | Shared transaction editor: configurable for all transaction types |
| `LineItemTable` | Editable table for transaction line items with keyboard navigation |
| `LineItemRow` | Single line: item, qty, unit, rate, discount, tax, total |
| `TaxCalculator` | Real-time tax calculation display synced with line changes |
| `DocumentTotals` | Summary panel: subtotal, discounts, charges, tax breakdown, round-off, grand total |
| `PaymentSplit` | Payment allocation: mode selector, amount, account, reference |
| `InvoicePreview` | Live invoice preview (matches PDF output) |
| `TransactionStatusBadge` | Visual status indicator (Draft, Posted, Paid, Overdue, Reversed) |
| `DocumentNumberField` | Auto-generated document number with sequence preview |
| `DueDateCalculator` | Due date from payment terms or manual entry |

### 8.5 Document Components

| Component | Description |
|---|---|
| `PDFViewer` | In-app PDF preview with zoom, print, download |
| `InvoicePDF` | PDF generation template (server-side rendering) |
| `ThermalPrintLayout` | Compact layout for thermal/POS printer output |
| `ShareDialog` | Share invoice via link, email, WhatsApp, SMS |
| `PrintSettingsPanel` | Theme, color, header, column, logo, signature, copies configuration |

### 8.6 Report Components

| Component | Description |
|---|---|
| `ReportPage` | Standard report layout: filters, date range, data, export actions |
| `ReportFilters` | Composable filter bar: date range, party, item, category, status |
| `ReportTable` | Read-only table with totals row, grouping, subtotals |
| `ReportExport` | Export to PDF, Excel, CSV |
| `DashboardGrid` | Responsive grid of StatCards and ChartPanels |
| `AgingTable` | Receivable/payable aging buckets (Current, 30, 60, 90, 90+) |
| `PartyStatementView` | Full party statement with opening/closing balance |

### 8.7 Utility Components

| Component | Description |
|---|---|
| `Toast` | Notification toast (success, error, warning, info) |
| `ConfirmDialog` | Confirmation modal with action/cancel |
| `ErrorBoundary` | Graceful error handling wrapper |
| `PermissionGate` | Conditional render based on user permissions |
| `FeatureGate` | Conditional render based on enabled features |
| `KeyboardShortcuts` | Global keyboard shortcut handler |
| `BarcodeScannerModal` | Camera/USB barcode scanning interface |
| `AuditTrailPanel` | Display audit history for any entity |
| `BulkActionBar` | Floating bar for multi-select bulk operations |
| `ImportWizard` | Step-by-step import: upload → map → validate → preview → confirm |
| `OnboardingWizard` | First-run setup flow with progress indicator |

---

## 9. Accounting Logic

### 9.1 Double-Entry Ledger

Every posted transaction creates a balanced journal entry where **total debits = total credits**.

### 9.2 Chart of Accounts (Default Nepal Template)

```
1000  ASSETS
├── 1100  Current Assets
│   ├── 1110  Cash in Hand
│   ├── 1120  Bank Accounts
│   ├── 1130  Accounts Receivable
│   ├── 1140  Inventory
│   ├── 1150  Advances Paid
│   └── 1160  VAT Recoverable (Input Tax Credit)
├── 1200  Fixed Assets
│   ├── 1210  Furniture & Fixtures
│   ├── 1220  Equipment & Machinery
│   ├── 1230  Vehicles
│   └── 1240  Accumulated Depreciation (contra)

2000  LIABILITIES
├── 2100  Current Liabilities
│   ├── 2110  Accounts Payable
│   ├── 2120  VAT Payable (Output Tax)
│   ├── 2130  TDS Payable
│   ├── 2140  Advances Received
│   ├── 2150  Salary Payable
│   └── 2160  Other Current Liabilities
├── 2200  Long-Term Liabilities
│   ├── 2210  Loans Payable
│   └── 2220  Other Long-Term Liabilities

3000  EQUITY
├── 3100  Owner's Capital
├── 3200  Retained Earnings
└── 3300  Current Year Profit/Loss

4000  REVENUE
├── 4100  Sales Revenue
├── 4200  Service Revenue
├── 4300  Other Income
└── 4400  Sales Returns & Allowances (contra)

5000  EXPENSES
├── 5100  Cost of Goods Sold (COGS)
├── 5200  Purchase Returns (contra)
├── 5300  Operating Expenses
│   ├── 5310  Rent
│   ├── 5320  Utilities
│   ├── 5330  Salary & Wages
│   ├── 5340  Office Supplies
│   ├── 5350  Transport & Logistics
│   ├── 5360  Communication
│   ├── 5370  Insurance
│   └── 5380  Miscellaneous
├── 5400  Depreciation Expense
└── 5500  Bank Charges & Fees
```

### 9.3 Journal Entry Patterns

#### Sale Invoice (NPR 10,000 + 13% VAT, NPR 5,000 cash received)

| Account | Debit (NPR) | Credit (NPR) |
|---|---|---|
| 1130 Accounts Receivable | 11,300 | |
| 4100 Sales Revenue | | 10,000 |
| 2120 VAT Payable | | 1,300 |

Payment allocation:

| Account | Debit (NPR) | Credit (NPR) |
|---|---|---|
| 1110 Cash in Hand | 5,000 | |
| 1130 Accounts Receivable | | 5,000 |

#### Purchase Bill (NPR 8,000 + 13% VAT, full credit)

| Account | Debit (NPR) | Credit (NPR) |
|---|---|---|
| 1140 Inventory (or 5300 Expense) | 8,000 | |
| 1160 VAT Recoverable | 1,040 | |
| 2110 Accounts Payable | | 9,040 |

#### Credit Note / Sale Return (NPR 2,000 + 13% VAT)

| Account | Debit (NPR) | Credit (NPR) |
|---|---|---|
| 4400 Sales Returns | 2,000 | |
| 2120 VAT Payable | 260 | |
| 1130 Accounts Receivable | | 2,260 |

Plus: stock-in movement to return items to inventory.

#### Expense (NPR 3,000, no tax, paid by bank)

| Account | Debit (NPR) | Credit (NPR) |
|---|---|---|
| 5310 Rent Expense | 3,000 | |
| 1120 Bank Account | | 3,000 |

#### Bank Transfer (Cash to Bank, NPR 50,000)

| Account | Debit (NPR) | Credit (NPR) |
|---|---|---|
| 1120 Bank Account | 50,000 | |
| 1110 Cash in Hand | | 50,000 |

### 9.4 Accounting Invariants

1. **Balanced entries**: Every journal entry must have `sum(debit) = sum(credit)`.
2. **Atomic posting**: Ledger, stock, tax, and payment updates happen in one database transaction.
3. **Immutable history**: Posted journals are never modified — corrections create compensating entries.
4. **Frozen snapshots**: Historical documents retain their original tax rates, calculation results, and display values.
5. **Sequence integrity**: Document numbers are unique per `{firm, transactionType, financialYear}`.
6. **Fiscal year boundaries**: Transactions cannot be posted to closed fiscal years without explicit reopen.
7. **Money precision**: All monetary operations use `Decimal128` with configurable scale (default 2). Never use floating point.
8. **Opening balances**: Opening balances for parties, cash/bank, and stock are initial journal entries at fiscal year start.
9. **Period-end**: Year-end close procedure carries forward balances and locks the closed year.

---

## 10. Invoice Calculation Rules

### 10.1 Server-Side Calculation Pipeline

The server is the sole authority for all calculations. Client-side previews are advisory only.

```
Step 1:  NORMALIZE UNITS
         Convert secondary unit quantity to primary unit using conversionFactor
         baseQuantity = quantity × conversionFactor

Step 2:  LINE GROSS AMOUNT
         grossAmount = quantity × rate
         (uses entered quantity, not baseQuantity, for display)

Step 3:  LINE DISCOUNT
         if discount.type == "percentage":
           discountAmount = grossAmount × (discount.value / 100)
         if discount.type == "amount":
           discountAmount = discount.value
         amountAfterDiscount = grossAmount - discountAmount

Step 4:  TAXABLE BASE
         if tax.isInclusive:
           taxableAmount = amountAfterDiscount / (1 + taxRate/100)
         else:
           taxableAmount = amountAfterDiscount

Step 5:  LINE TAX
         For each tax component:
           taxAmount = round(taxableAmount × (rate / 100), decimalPlaces)
         totalLineTax = sum(all component tax amounts)

Step 6:  LINE TOTAL
         if tax.isInclusive:
           lineTotal = amountAfterDiscount  (tax already included)
         else:
           lineTotal = amountAfterDiscount + totalLineTax

Step 7:  AGGREGATE LINES
         subtotal = sum(all amountAfterDiscount)
         totalTax = sum(all totalLineTax)

Step 8:  DOCUMENT DISCOUNT
         if documentDiscount.type == "percentage":
           docDiscountAmount = subtotal × (documentDiscount.value / 100)
         else:
           docDiscountAmount = documentDiscount.value
         subtotalAfterDiscount = subtotal - docDiscountAmount

Step 9:  ADDITIONAL CHARGES
         For each charge:
           add charge.amount to subtotal
           if charge has tax: calculate and add charge tax
         totalAfterCharges = subtotalAfterDiscount + sum(charges) + sum(charge taxes)

Step 10: WITHHOLDING / TDS
         if withholding rule applies and amount > threshold:
           withholdingAmount = totalAfterCharges × (withholdingRate / 100)

Step 11: ROUND-OFF
         if roundOffEnabled:
           roundOff = round(totalAfterCharges) - totalAfterCharges
           (using configured rounding method: nearest, up, down)

Step 12: GRAND TOTAL
         grandTotal = totalAfterCharges + roundOff - withholdingAmount

Step 13: PAYMENT & BALANCE
         paidAmount = sum(all payment entries)
         balanceDue = grandTotal - paidAmount
```

### 10.2 Rounding Rules

| Context | Rule |
|---|---|
| Line tax | Round to configured decimal places (default 2) per component |
| Document round-off | Optional; applied to grand total before payment |
| Payment allocation | Exact match; no rounding |
| Report aggregation | Sum of stored rounded values; never re-derive from rates |

### 10.3 Snapshot Preservation

When a transaction is posted, the following are persisted on the document:

- Tax policy version at time of posting
- All calculated amounts (not just inputs)
- Rounding method and adjustment
- Calculation timestamp

**Never recalculate a historical invoice using current tax settings.** The snapshot is the source of truth for audit, reports, and reprints.

---

## 11. GST / VAT Implementation

### 11.1 Nepal Tax Context

| Attribute | Detail |
|---|---|
| Primary tax | Value Added Tax (VAT) |
| Standard rate | 13% (as of 2026; verify with IRD) |
| Governing body | Inland Revenue Department (IRD) |
| Registration | PAN required for all; VAT registration for turnover > threshold |
| Invoice requirement | VAT invoices must include PAN, VAT number, date, buyer details, item-wise tax breakdown |
| Filing | Monthly/bimonthly VAT return to IRD |

### 11.2 Tax Policy Architecture

Tax is implemented as a **policy/configuration module**, not hardcoded:

```
tax_policies collection:
├── "Nepal VAT 13%"       → rate: 13%, type: VAT, inclusive/exclusive configurable
├── "VAT Exempt"          → rate: 0%, exempt flag
├── "Zero-Rated"          → rate: 0%, zero-rated flag (different from exempt for ITC)
├── "Reduced Rate"        → future: for any reduced VAT rate categories
└── Custom policies       → org-specific tax configurations
```

### 11.3 Tax Calculation Modes

**Tax-Exclusive (default)**:
```
Item price: NPR 1,000
Tax (13%): NPR 130
Line total: NPR 1,130
```

**Tax-Inclusive**:
```
Item price (inclusive): NPR 1,130
Taxable amount: NPR 1,130 / 1.13 = NPR 1,000
Tax: NPR 130
Line total: NPR 1,130
```

### 11.4 Input Tax Credit (ITC) / VAT Recovery

- VAT-registered businesses can recover input VAT paid on purchases.
- Purchase bills create a debit to `1160 VAT Recoverable`.
- Sale invoices create a credit to `2120 VAT Payable`.
- Net VAT liability = `VAT Payable - VAT Recoverable`.
- VAT report surfaces this calculation for filing.

### 11.5 Withholding Tax / TDS Foundations

| Rule | Description |
|---|---|
| TDS on Rent | Deduct at source when paying rent above threshold |
| TDS on Services | Deduct at source for professional/consulting services |
| TDS on Contracts | Deduct at source for contract payments |

TDS is:
- Configured per `withholding_rules` with rate and threshold.
- Applied at the document level after tax calculation.
- Debited from payment to the party.
- Credited to `2130 TDS Payable` account.
- Reported separately for IRD TDS filing.

### 11.6 Tax Reports

| Report | Description |
|---|---|
| VAT Summary | Total output VAT (sales) vs. input VAT (purchases), net payable/refundable |
| VAT Detail | Line-by-line tax breakdown per invoice |
| Sales Tax Register | All sales with tax details for VAT return filing |
| Purchase Tax Register | All purchases with ITC details |
| TDS Report | All TDS deductions with party, amount, rate for TDS filing |
| HSN/SAC Summary | Tax summary grouped by HSN/SAC codes |

### 11.7 IRD Integration (Future)

- **Electronic VAT billing**: If IRD mandates electronic invoicing, the system will integrate via IRD API to register invoices and obtain fiscal identifiers.
- **VAT return filing**: Export data in IRD-compatible format; direct API filing when available.
- All IRD integration requirements must be verified against current IRD guidance before implementation.

---

## 12. Inventory Workflow

### 12.1 Stock Management Model

- Inventory is tracked via **stock movements** — every stock change creates a movement record.
- `stock_balances` is a materialized projection rebuilt from movements; it is a cache, not the source of truth.
- Only items with `isStockTracked: true` create inventory movements. Services do not affect stock.

### 12.2 Stock Movement Types

| Movement Type | Trigger | Quantity Effect |
|---|---|---|
| `in` | Purchase bill posted | +quantity at cost rate |
| `out` | Sale invoice posted | -quantity at FIFO/weighted avg cost |
| `adjustment` | Manual stock adjustment | +/- quantity |
| `transfer_out` | Stock transfer (source store) | -quantity |
| `transfer_in` | Stock transfer (dest. store) | +quantity |
| `return_in` | Credit note (sale return) | +quantity |
| `return_out` | Debit note (purchase return) | -quantity |

### 12.3 Costing Methods

| Method | Description | Default |
|---|---|---|
| **Weighted Average** | New cost = (existing value + new purchase value) / total quantity | ✅ (MVP) |
| **FIFO** | First-In, First-Out cost assignment | Phase 2 |
| **Specific Identification** | Per-batch or per-serial cost | Phase 2 |

### 12.4 Stock Operations

#### Opening Stock
```
1. Set opening quantity, rate, and value per item per store
2. System creates stock-in movement dated at fiscal year start
3. Journal: Debit 1140 Inventory, Credit 3100 Owner's Capital (or opening equity)
```

#### Sale (Stock Out)
```
1. Invoice posted → stock-out movements created per line item
2. Quantity reduced from store
3. Cost calculated per costing method
4. Journal: Debit 5100 COGS, Credit 1140 Inventory (at cost)
```

#### Purchase (Stock In)
```
1. Bill posted → stock-in movements created per line item
2. Quantity added to store at purchase rate
3. Weighted average cost recalculated
4. Journal: Debit 1140 Inventory (at purchase cost)
```

#### Manual Adjustment
```
1. User creates stock adjustment (add or reduce)
2. Enter item, store, quantity change, reason
3. Movement created; balance updated
4. Journal: Debit/Credit 1140 Inventory ↔ Adjustment account
```

#### Stock Transfer (Phase 2)
```
1. Select source store, destination store
2. Add items with quantities
3. Validate source availability
4. Create paired movements: transfer_out (source) + transfer_in (dest)
5. No accounting impact (same org, same inventory account)
```

### 12.5 Low-Stock Alerts

- Each item has an optional `minimumStock` threshold.
- System checks after every stock-out movement.
- If `currentQuantity ≤ minimumStock`, trigger notification (in-app, optional email/SMS).
- Dashboard widget shows all low-stock items.

### 12.6 Negative Stock Policy

| Setting | Behavior |
|---|---|
| `negativeStockAllowed: false` (default) | Posting fails if sale quantity > available stock |
| `negativeStockAllowed: true` | Sale posts with warning; balance goes negative |

Configurable per organization. Enforceable per role in Phase 2.

### 12.7 Inventory Reports

| Report | Description |
|---|---|
| Stock Summary | Current quantity and value per item (all stores or per store) |
| Stock Detail | Movement history per item with running balance |
| Low Stock | Items at or below minimum threshold |
| Stock Valuation | Total inventory value by costing method |
| Item-wise Profit | Sale revenue minus COGS per item |
| Category-wise Stock | Stock grouped by item category |
| Store-wise Stock (Phase 2) | Stock per store with transfer history |

---

## 13. Reports

### 13.1 Report Architecture

- All reports derive from **journal lines** (accounting) and **stock movements** (inventory) — never from UI-maintained totals.
- Every report response includes: currency, timezone, filters applied, generated timestamp, and accounting basis.
- Exported report totals must exactly match on-screen report for the same filter snapshot.
- Date-range reports support both Gregorian and Bikram Sambat date inputs (converted to Gregorian internally).

### 13.2 Dashboard Reports

| Widget | Data |
|---|---|
| Total Sales (period) | Sum of posted sale invoices |
| Total Purchases (period) | Sum of posted purchase bills |
| Total Expenses (period) | Sum of posted expense vouchers |
| Total Receivable | Outstanding customer balances |
| Total Payable | Outstanding supplier balances |
| Cash in Hand | Current cash account balance |
| Bank Balance | Sum of all bank account balances |
| Net Profit (period) | Revenue - COGS - Expenses |
| Top 5 Customers | By revenue in period |
| Top 5 Items | By quantity or revenue in period |
| Sales Trend | Line chart: daily/weekly/monthly sales |
| Receivable Aging Summary | Pie chart: current, 30, 60, 90, 90+ days |

### 13.3 Accounting Reports

| Report | Description | Source |
|---|---|---|
| **Day Book** | All transactions chronologically for a date range | `transactions` |
| **Profit & Loss** | Revenue minus expenses for a period | `journal_lines` (accounts 4xxx-5xxx) |
| **Balance Sheet** | Assets = Liabilities + Equity at a point in time | `journal_lines` (accounts 1xxx-3xxx) |
| **Cash Flow Statement** | Cash inflows and outflows by category | `journal_lines` (cash/bank accounts) |
| **Trial Balance** | Debit and credit balances for all accounts | `journal_lines` aggregate |
| **Ledger** | All entries for a specific account with running balance | `journal_lines` filtered by account |

### 13.4 Party Reports

| Report | Description |
|---|---|
| **Party Statement** | All transactions for a party with opening/closing balance |
| **Receivable Report** | All outstanding customer invoices with amounts and aging |
| **Payable Report** | All outstanding supplier bills with amounts and aging |
| **Sales Aging** | Customer receivables bucketed: Current, 1-30, 31-60, 61-90, 90+ days |
| **Purchase Aging** | Supplier payables bucketed similarly |
| **Party-wise Sales** | Total sales per customer in period |
| **Party-wise Purchase** | Total purchases per supplier in period |
| **Party-wise Profit** | Revenue minus COGS per customer |

### 13.5 Inventory Reports

| Report | Description |
|---|---|
| **Stock Summary** | Current qty, value for all items |
| **Stock Detail** | Movement history per item with running balance |
| **Low Stock Alert** | Items at or below minimum threshold |
| **Stock Valuation** | Total inventory value (weighted avg / FIFO) |
| **Item-wise Profit** | Sale revenue minus COGS per item |
| **Item-wise Sales/Purchase** | Transaction detail per item |
| **Category-wise Stock** | Stock grouped by category |
| **Item Rate History** | Price changes over time per item |

### 13.6 Tax Reports

| Report | Description |
|---|---|
| **VAT Summary** | Output VAT vs Input VAT, net liability |
| **VAT Detail** | Invoice-level VAT breakdown |
| **Sales Tax Register** | All taxable sales for filing |
| **Purchase Tax Register** | All taxable purchases with ITC |
| **TDS Deduction Report** | TDS deducted per party, per rate |
| **HSN/SAC Summary** | Tax aggregated by HSN/SAC code |

### 13.7 Operational Reports

| Report | Description |
|---|---|
| **Sales Report** | Sales filtered by date, party, item, status |
| **Purchase Report** | Purchases filtered similarly |
| **Expense Report** | Expenses by category, party, date |
| **Payment Report** | All receipts and payments with allocation status |
| **Estimate Report** | Estimates by status: open, converted, expired (Phase 2) |
| **Order Report** | Orders by fulfilment status (Phase 2) |
| **Cheque Report** | Cheques by status: pending, cleared, bounced |

### 13.8 Report Filters & Export

All reports support:

| Filter | Description |
|---|---|
| Date range | Start and end date (Gregorian or BS) |
| Financial year | Filter to a specific fiscal year |
| Firm/Branch | Filter by firm (multi-firm orgs) |
| Party | Filter by specific customer/supplier |
| Item/Category | Filter by item or item category |
| Transaction type | Filter by sale, purchase, payment, etc. |
| Status | Filter by draft, posted, paid, overdue, etc. |

Export formats:
- **PDF**: Formatted report with headers, totals, branding
- **Excel (.xlsx)**: Raw data with formulas for subtotals
- **CSV**: Plain data export for external tools

---

## 14. Security Requirements

### 14.1 Authentication

| Requirement | Implementation |
|---|---|
| Primary auth | Phone/email + password |
| OTP verification | SMS or email OTP for account verification |
| MFA | Optional TOTP-based two-factor authentication |
| Session tokens | JWT with short-lived access token + long-lived refresh token |
| Token rotation | Refresh tokens rotated on use; old tokens invalidated |
| Password policy | Minimum 8 characters, complexity rules, bcrypt/argon2 hashing |
| Account lockout | Temporary lockout after 5 failed login attempts |
| Session management | Users can view and revoke active sessions |

### 14.2 Authorization

| Requirement | Implementation |
|---|---|
| RBAC | Role-based access control with granular permissions |
| Server enforcement | All permissions checked on the API layer — never trust the client |
| Resource scoping | Every query/mutation filtered by `organizationId` |
| Tenant isolation | Organization A cannot access Organization B's data under any circumstance |
| Ownership scoping | Salesperson sees only own transactions (scope: `own`) |
| Feature gating | Disabled features return 403 even if permission exists |

### 14.3 Data Protection

| Requirement | Implementation |
|---|---|
| Encryption in transit | TLS 1.2+ for all connections |
| Encryption at rest | AES-256 for database storage and backups |
| PII handling | Sensitive fields (PAN, phone, email) encrypted at field level |
| Data residency | Data stored in jurisdiction-appropriate region |
| Data retention | Configurable retention policies; financial data retained per legal requirements |
| Right to export | Users can export all their organization data |
| Secure deletion | Soft-delete with hard-delete after retention period |

### 14.4 API Security

| Requirement | Implementation |
|---|---|
| CSRF protection | CSRF tokens for all state-changing requests from browser |
| Rate limiting | Per-user and per-IP rate limits on all endpoints |
| Input validation | Server-side validation of all inputs; reject unexpected fields |
| SQL/NoSQL injection | Parameterized queries; no string concatenation in queries |
| XSS prevention | Output encoding; Content-Security-Policy headers |
| CORS | Strict origin whitelist |
| Idempotency | Financial creates require `Idempotency-Key` header |
| File upload | Type validation, size limits, virus scanning, isolated storage |

### 14.5 Audit Trail

All of the following events are immutably logged:

| Event Category | Examples |
|---|---|
| Authentication | Login success/failure, logout, password change, MFA enable/disable |
| User management | Invite, role change, deactivation, permission change |
| Financial operations | Transaction create, post, edit, reverse, delete |
| Data operations | Import, export, backup, restore |
| Settings changes | Tax policy change, company settings update, sequence override |
| Security events | Suspicious activity, rate limit triggers, failed authorization |

Each audit event includes: `userId`, `userName`, `action`, `resourceType`, `resourceId`, `before/after snapshot`, `ipAddress`, `userAgent`, `correlationId`, `timestamp`.

### 14.6 Infrastructure Security

| Requirement | Implementation |
|---|---|
| Secret management | API keys, DB credentials in vault (not in code/env files) |
| Secret rotation | Automated rotation of credentials and tokens |
| Network security | Firewall rules, VPC isolation, no public DB access |
| Dependency scanning | Automated vulnerability scanning of npm/pip packages |
| Container security | Minimal base images, non-root execution |
| Logging | Structured logs with correlation IDs; PII redacted |
| Monitoring | Real-time alerting on security anomalies |
| Incident response | Documented response plan for security breaches |
| Backup security | Encrypted backups; tested restore procedures |

### 14.7 Compliance

| Standard | Approach |
|---|---|
| Nepal tax law | Invoice format, PAN/VAT compliance per IRD requirements |
| Data protection | Follow Nepal Electronic Transaction Act guidelines |
| Financial audit | Immutable audit trail supports external audit |
| WCAG 2.2 AA | Accessibility targets for all user interfaces |

---

## 15. Appendix: Glossary & State Machines

### 15.1 Glossary

| Term | Definition |
|---|---|
| **Organization** | Top-level tenant entity; owns all data |
| **Firm** | A legal identity/branch within an organization; issues documents |
| **Financial Year** | Accounting period (typically Shrawan 1 to Ashad end in Nepal) |
| **Party** | A customer, supplier, or both |
| **Transaction** | Any business document: invoice, bill, payment, expense, return, etc. |
| **Posting** | The act of finalizing a transaction, making it affect the ledger and inventory |
| **Journal Entry** | A balanced debit/credit record in the double-entry ledger |
| **Stock Movement** | A record of inventory quantity change at a specific store |
| **Document Sequence** | Auto-incrementing numbering series for a document type per firm/fiscal year |
| **Payment Allocation** | Mapping of a payment to one or more invoices/bills it settles |
| **Credit Note** | A return/refund document against a sale invoice |
| **Debit Note** | A return document against a purchase bill |
| **PAN** | Permanent Account Number (Nepal tax ID, 9 digits) |
| **VAT** | Value Added Tax (13% standard rate in Nepal) |
| **IRD** | Inland Revenue Department (Nepal tax authority) |
| **Bikram Sambat (BS)** | Nepali calendar system; ~57 years ahead of Gregorian |
| **ITC** | Input Tax Credit — VAT paid on purchases recoverable against VAT collected on sales |
| **TDS** | Tax Deducted at Source — withholding tax deducted when making certain payments |
| **COGS** | Cost of Goods Sold — direct cost of items sold |
| **NPR** | Nepalese Rupee |
| **HSN/SAC** | Harmonized System Nomenclature / Service Accounting Code for tax classification |
| **Idempotency Key** | Client-generated unique key to prevent duplicate financial operations on retry |
| **Outbox Event** | Async event created alongside a transaction for side-effects (PDF, notifications) |

### 15.2 Transaction State Machines

#### Invoice / Bill / Payment / Expense / Return

```
               ┌──────────┐
               │  Draft    │
               └────┬─────┘
                    │ validate & post
                    ▼
         ┌─────────────────────┐
    ┌────│       Posted        │────┐
    │    └─────────┬───────────┘    │
    │              │                │
    │   allocate   │                │ due date passes
    │   payment    │                │
    ▼              ▼                ▼
┌────────┐  ┌──────────────┐  ┌─────────┐
│  Paid  │  │ Partially    │  │ Overdue │
│        │  │ Paid         │  │         │
└───┬────┘  └──────┬───────┘  └────┬────┘
    │              │               │
    │              │ allocate      │ allocate
    │              │ remainder     │ payment
    │              ▼               │
    │         ┌────────┐           │
    │         │  Paid  │◄──────────┘
    │         └───┬────┘
    │             │
    ▼             ▼
┌────────────────────────┐
│    Reversed            │ (controlled reversal
│    (with compensating  │  with reason + audit)
│     entries)           │
└────────────────────────┘

Also from Draft:
  Draft → Voided (discard with audit trail, no ledger impact)
```

#### Estimate / Quotation (Phase 2)

```
┌─────────┐     ┌──────┐     ┌─────────────────────┐     ┌───────────┐
│  Draft   │────▶│ Open │────▶│ Partially Converted │────▶│ Converted │
└─────────┘     └──┬───┘     └─────────────────────┘     └───────────┘
                   │
                   ▼
              ┌──────────┐     ┌───────────┐
              │ Expired  │     │ Cancelled │
              └──────────┘     └───────────┘
```

#### Sale Order / Purchase Order (Phase 2)

```
┌─────────┐     ┌──────┐     ┌──────────────────────┐     ┌───────────┐
│  Draft   │────▶│ Open │────▶│ Partially Fulfilled  │────▶│ Fulfilled │
└─────────┘     └──┬───┘     └──────────────────────┘     └───────────┘
                   │
                   ▼
              ┌───────────┐
              │ Cancelled │
              └───────────┘
```

#### Delivery Challan (Phase 2)

```
┌─────────┐     ┌────────┐     ┌───────────────────────────┐     ┌──────────┐
│  Draft   │────▶│ Issued │────▶│ Partially Returned /      │────▶│ Returned │
└─────────┘     └────┬───┘     │ Partially Invoiced        │     │ Invoiced │
                     │         └───────────────────────────┘     │ Closed   │
                     ▼                                           └──────────┘
                ┌───────────┐
                │ Cancelled │
                └───────────┘
```

### 15.3 Document Conversion Chain

```
Estimate ──convert──▶ Sale Order ──convert──▶ Sale Invoice
                                  ──convert──▶ Delivery Challan ──convert──▶ Sale Invoice

Purchase Order ──convert──▶ Purchase Bill

Sale Invoice ──return──▶ Credit Note
Purchase Bill ──return──▶ Debit Note
```

Each conversion creates a `linkedDocuments` entry on both the source and target, preserving full traceability. Partial conversions track remaining unconverted quantities.

---

*End of Smart Billing ERP System Requirements Specification v1.0*
