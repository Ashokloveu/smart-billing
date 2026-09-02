# SMART BILLING ERP SYSTEM
## Production Implementation Plan & Roadmap
### Version 1.0 | September 2026

> **Derivation**: Synthesized from [SMART_BILLING_ERP_SRS.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_ERP_SRS.md), [SMART_BILLING_TECHNICAL_ARCHITECTURE.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_TECHNICAL_ARCHITECTURE.md), [SMART_BILLING_DATABASE_DESIGN.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_DATABASE_DESIGN.md), and [SMART_BILLING_API_SPECIFICATION.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_API_SPECIFICATION.md).  
> **Architecture**: MERN Stack + TypeScript (Node.js + Express + React 19 + MongoDB 7.0 Replica Set).  
> **Status**: Implementation Roadmap & Execution Plan (Design & Work-Breakdown Blueprint Only — No Code).  
> **Regional Focus**: Nepal (NPR Currency, Asia/Kathmandu Timezone, Bikram Sambat dual-calendar, IRD VAT/PAN Compliance).

---

## Table of Contents

1. [Roadmap Overview & Phasing Strategy](#1-roadmap-overview--phasing-strategy)
2. [Phase 1: Project Foundation & Core Infrastructure](#2-phase-1-project-foundation--core-infrastructure)
3. [Phase 2: Organization & Master Data Engine](#3-phase-2-organization--master-data-engine)
4. [Phase 3: Inventory Management & Stock Subledger](#4-phase-3-inventory-management--stock-subledger)
5. [Phase 4: Sales & Purchase Transaction Engine](#5-phase-4-sales--purchase-transaction-engine)
6. [Phase 5: Financial Accounting & Double-Entry Ledger](#6-phase-5-financial-accounting--double-entry-ledger)
7. [Phase 6: Reports, Dashboards & Document Generation](#7-phase-6-reports-dashboards--document-generation)
8. [Phase 7: Production Readiness, Security & DevOps](#8-phase-7-production-readiness-security--devops)
9. [Milestone Schedule & Critical Path Analysis](#9-milestone-schedule--critical-path-analysis)

---

## 1. Roadmap Overview & Phasing Strategy

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Implementation Roadmap                                         │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
  [Phase 1: Foundation]
     │ Monorepo, Auth, RBAC, Database Connection, Logging, Error Framework
     ▼
  [Phase 2: Organization & Master Data]
     │ Tenancy, Branches, Fiscal Years, Parties, Items, Categories, Tax Policies
     ▼
  [Phase 3: Inventory Engine]
     │ Warehouses, In/Out Stock Movements, Weighted Average Costing, Adjustments, Transfers
     ▼
  [Phase 4: Sales & Purchase Engine]
     │ Invoices, Purchase Bills, POS Thermal/A4 PDF, Receipts, Payments, Credit/Debit Notes
     ▼
  [Phase 5: Double-Entry Accounting]
     │ Chart of Accounts, General Journal, Cash/Bank Books, Aging Ledgers, P&L, Balance Sheet
     ▼
  [Phase 6: Reports & Dashboards]
     │ Nepal IRD VAT Register (Annex 5), Real-Time Dashboards, Automated Excel/PDF Exports
     ▼
  [Phase 7: Production Readiness]
     │ Performance Tuning, Docker Clustering, SSL, Automated Encrypted Backup, Monitoring
```

---

## 2. Phase 1: Project Foundation & Core Infrastructure

### 2.1 Scope & Objective
Establish an enterprise-grade MERN + TypeScript monorepo containing development tooling, database connection pools, strict environment management, multi-tenancy context propagation, centralized logging, structured error handling, JWT authentication, and the RBAC authorization engine.

### 2.2 Database Work
- Provision local and staging MongoDB 7.0 replica sets (`rs0`) with WiredTiger storage engine.
- Configure MongoDB client connection pooling in Node.js with `maxPoolSize: 50`, `minPoolSize: 10`, `serverSelectionTimeoutMS: 5000`.
- Create initialization scripts for collections: `users`, `roles`, `permissions`, `audit_logs`, `idempotency_keys`.
- Deploy compound and TTL indexes:
  - `idempotency_keys`: `{ expiresAt: 1 }` (TTL index, 48-hour purge).
  - `users`: Unique indexes on `{ email: 1 }` and `{ phone: 1 }`.
  - `audit_logs`: Compound index `{ organizationId: 1, timestamp: -1 }`.

### 2.3 Backend Tasks
- **Monorepo Setup**: Configure PNPM or npm workspaces linking `backend`, `frontend`, and `shared-types`.
- **TypeScript Configuration**: Set up strict `tsconfig.json` (`strict: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes: true`).
- **Environment Management**: Implement `env.ts` with Zod schema validation checking all environment variables at process boot.
- **Logging Pipeline**: Configure Pino structured JSON logging with context propagation (`correlationId`, `userId`, `organizationId`) via Node.js `AsyncLocalStorage`.
- **Middleware Pipeline**:
  - `traceId`: RFC 4122 UUID injection.
  - `errorHandler`: RFC 7807 centralized problem details response formatter.
  - `authenticate`: RS256 JWT public key validation.
  - `authorize`: Permission evaluator enforcing `resource:action:scope`.
  - `rateLimiter`: Redis-backed sliding window limiter.
- **Auth Engine**:
  - Password hashing with Argon2id.
  - Sliding refresh token rotation with token-family compromise detection.
  - TOTP MFA verification endpoint.

### 2.4 Frontend Tasks
- **Vite Setup**: Initialize React 19 + TypeScript with strict compiler settings.
- **State Infrastructure**:
  - Configure TanStack Query v5 with custom query cache and error boundary integration.
  - Configure Zustand stores for `authStore` (user, tokens) and `uiStore` (theme, sidebar).
- **HTTP Client**: Axios singleton with request correlation ID injection and silent refresh token queue interceptors.
- **Router & Guards**: Set up React Router v7 with `AuthGuard`, `OrgGuard`, and `PermissionGuard`.
- **UI Design Tokens**: Setup pure CSS design system variables (colors, typography, spacing, shadows).

### 2.5 APIs Required
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/mfa/verify`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### 2.6 Dependencies
- Node.js 20+ LTS, MongoDB 7.0, Redis 7.2.
- Packages: `express`, `mongoose`, `zod`, `pino`, `argon2`, `jsonwebtoken`, `otplib`, `react`, `react-router-dom`, `@tanstack/react-query`, `zustand`, `axios`.

### 2.7 Testing Checklist
- [ ] Database connection pool properly handles network disconnection and automatic reconnects.
- [ ] Zod halts process startup when required environment variables are absent.
- [ ] Argon2id rejects passwords with invalid complexity or timing attacks.
- [ ] Refresh token reuse triggers invalidation of all active user sessions.
- [ ] Axios silent refresh interceptor recovers gracefully from 401 without dropping in-flight requests.
- [ ] RBAC rejects unauthorized requests with standardized HTTP 403 envelope.

### 2.8 Completion Criteria
Complete user login, token refresh, and permission checks function flawlessly across frontend and backend with 100% type safety and zero floating point issues.

---

## 3. Phase 2: Organization & Master Data Engine

### 3.1 Scope & Objective
Deliver the complete multi-tenant hierarchy and master data management catalog, supporting companies, physical branches, Nepali fiscal years, parties (customers/suppliers), catalog items, units, categories, and tax policy configurations.

### 3.2 Database Work
- Implement Mongoose schemas: `organizations`, `firms`, `company_users`, `fiscal_periods`, `parties`, `party_groups`, `items`, `categories`, `units`, `tax_policies`.
- Deploy validation rules and indexes:
  - `organizations`: Unique `{ slug: 1 }`, sparse `{ "taxRegistration.number": 1 }`.
  - `firms`: Unique `{ organizationId: 1, code: 1 }`.
  - `parties`: Unique `{ organizationId: 1, name: 1, type: 1 }`, index `{ organizationId: 1, panNumber: 1 }`.
  - `items`: Unique `{ organizationId: 1, code: 1 }`, sparse unique `{ organizationId: 1, barcode: 1 }`.
  - `tax_policies`: Compound `{ organizationId: 1, name: 1, version: -1 }`.

### 3.3 Backend Tasks
- **Multi-Tenant Middleware (`tenantContext`)**: Extract `:orgId`, verify user membership, hydrate active firm and fiscal period.
- **Organization Service**: Company onboarding, firm/branch setup, and Nepali fiscal year registration (Shrawan to Ashad).
- **Party Service**: Customer and supplier CRUD, credit limit validation, opening balance booking, PAN/VAT formatting checks.
- **Item Service**: Product and service creation, primary/secondary unit conversion calculations, HSN/SAC classification, and default tax policy binding.
- **Tax Policy Engine**: Versioned tax policy rules (13% Nepal VAT, exemptions, inclusive/exclusive pricing).

### 3.4 Frontend Tasks
- **Tenant Management UI**: Organization switcher, branch selector, fiscal year setup screen.
- **Master Data Components**:
  - `PartySelect`: Autocomplete picker displaying outstanding balance and credit limit.
  - `ItemSelect`: Barcode/SKU picker with live pricing and unit conversions.
  - `BSDatePicker`: Accessible modal for Nepali Bikram Sambat date entry.
- **Master Screens**:
  - Parties list and detail with opening balance entry.
  - Product catalog table with category hierarchy and image upload.
  - Tax configuration screen.

### 3.5 APIs Required
- `GET /api/v1/organizations/:orgId`
- `PATCH /api/v1/organizations/:orgId`
- `GET / POST /api/v1/organizations/:orgId/firms`
- `POST /api/v1/organizations/:orgId/fiscal-years`
- `GET / POST /api/v1/organizations/:orgId/users`
- `GET / POST /api/v1/organizations/:orgId/parties`
- `GET / POST /api/v1/organizations/:orgId/items`
- `GET / POST /api/v1/organizations/:orgId/tax-policies`

### 3.6 Dependencies
- Phase 1 foundation complete.
- Client utility: `bikram-sambat` date parser.

### 3.7 Testing Checklist
- [ ] Cross-tenant isolation asserts that Tenant A cannot access or mutate Tenant B's master records.
- [ ] 9-digit PAN validation rejects alphanumeric or malformed tax IDs.
- [ ] Item unit conversion correctly transforms secondary unit sales into base inventory counts.
- [ ] New fiscal year creation rejects overlapping calendar ranges.
- [ ] Inactive parties/items are hidden from active lookup selectors.

### 3.8 Completion Criteria
A business owner can register an organization, establish two branch locations, configure Nepal 13% VAT, input fiscal periods, and populate customers, suppliers, and items.

---

## 4. Phase 3: Inventory Management & Stock Subledger

### 4.1 Scope & Objective
Implement an append-only stock movement engine, multi-warehouse location tracking, manual stock adjustments, inter-store transfers, and real-time inventory valuation using the Weighted Average Cost (WAC) method.

### 4.2 Database Work
- Implement collections: `warehouses`, `stock_movements`, `stock_balances`.
- Deploy compound indexes:
  - `stock_movements`: `{ organizationId: 1, itemId: 1, warehouseId: 1, date: -1 }`.
  - `stock_balances`: Unique `{ organizationId: 1, warehouseId: 1, itemId: 1 }`.
- Set up schema-level assertions enforcing positive quantities on stock movements and `Decimal128` precision for unit cost rates.

### 4.3 Backend Tasks
- **Warehouse Service**: Create, update, and manage physical storage godowns per branch firm.
- **Stock Movement Processor**:
  - Executes inside MongoDB transactions during physical movement events.
  - Records direction (`IN` or `OUT`), transaction reference, cost rate, and lot details.
- **Valuation Engine**: Recalculates Weighted Average Cost upon each purchase movement:
  $$\text{New Cost} = \frac{(\text{Current Qty} \times \text{Current Cost}) + (\text{New Qty} \times \text{Purchase Cost})}{\text{Current Qty} + \text{New Qty}}$$
- **Stock Adjustment & Transfer Engine**: Validates source warehouse availability and writes balanced debit/credit movement pairs.
- **Negative Stock Policy Enforcement**: Evaluates organization setting `allowNegativeStock` before processing any dispatch.

### 4.4 Frontend Tasks
- **Warehouse Management Screen**: Store creation, firm association, default store selection.
- **Stock Adjustment Form**: Item selector, warehouse picker, adjustment type (add/reduce), reason code, and offset account picker.
- **Inter-Warehouse Transfer Form**: Source warehouse selector, target warehouse selector, line item grid.
- **Live Inventory Positions Grid**: TanStack Table with virtualized scrolling, color-coded low-stock warnings, and warehouse filters.

### 4.5 APIs Required
- `GET / POST /api/v1/organizations/:orgId/warehouses`
- `POST /api/v1/organizations/:orgId/inventory/adjustments`
- `POST /api/v1/organizations/:orgId/inventory/transfers`
- `GET /api/v1/organizations/:orgId/inventory/balances`
- `GET /api/v1/organizations/:orgId/inventory/ledger/:itemId`

### 4.6 Dependencies
- Phase 2 catalog and unit items.

### 4.7 Testing Checklist
- [ ] Stock-out dispatches fail when stock is insufficient and `allowNegativeStock: false`.
- [ ] Inter-warehouse transfer accurately decrements source warehouse and increments target warehouse by the same base quantity.
- [ ] Weighted average unit cost adjusts mathematically after each receipt at different purchase rates.
- [ ] Stock movements write successfully inside atomic sessions.

### 4.8 Completion Criteria
Stock movements correctly track all inventory additions and deductions, maintain accurate warehouse quantities, and reflect precise inventory valuation across all locations.

---

## 5. Phase 4: Sales & Purchase Transaction Engine

### 5.1 Scope & Objective
Build the transactional core of the ERP: Sales Invoices, Purchase Bills, POS Thermal and A4 PDF printing, Payment Collections, Supplier Disbursements, Sales Returns (Credit Notes), and Purchase Returns (Debit Notes) with atomic double-entry journal creation and stock adjustments.

### 5.2 Database Work
- Implement collections: `transactions`, `document_sequences`, `payments`, `payment_allocations`.
- Deploy indexes:
  - `transactions`: Unique `{ organizationId: 1, documentNumber: 1 }`, `{ organizationId: 1, type: 1, status: 1, date: -1 }`.
  - `document_sequences`: Unique `{ organizationId: 1, firmId: 1, financialYearId: 1, type: 1 }`.
  - `idempotency_keys`: Unique `{ idempotencyKey: 1 }`.

### 5.3 Backend Tasks
- **Atomic Sequence Number Generator**: Uses `findOneAndUpdate` with `$inc` on `document_sequences` to generate sequential numbers (`INV-2082/83-0001`) with zero gaps.
- **Invoice Calculation Pipeline**:
  - Executes 13-stage deterministic arithmetic using `Decimal128`.
  - Handles line discounts, taxable base calculation, Nepal 13% VAT, document shipping charges, and round-off adjustments.
- **Atomic Posting Orchestration**: Executes within a single MongoDB session:
  1. Assigns sequence number and marks transaction `posted`.
  2. Generates balanced double-entry `journal_entries`.
  3. Writes `stock_movements` for stock-tracked items.
  4. Creates `payment_allocations` and adjusts customer/supplier current balances.
  5. Emits `audit_logs` and `outbox_events`.
- **Returns Engine**: Enforces that Credit/Debit Note return quantities do not exceed original invoice quantities.
- **Headless PDF Rendering**: Worker job using Puppeteer generating IRD-compliant A4 tax invoices and 80mm ESC/POS thermal formats.

### 5.4 Frontend Tasks
- **Transaction Form (`TransactionForm`)**:
  - Reactive line item table supporting rapid keyboard navigation (Enter/Tab to add row).
  - Real-time client calculation hook (`useInvoiceCalculator`) mirroring backend math.
  - Payment split interface (Cash, Bank Transfer, Cheque).
- **Invoice Print & Preview Modal**: Live A4 preview, direct print triggers, PDF download.
- **Payment Collection Modal**: Party selector showing open bills with quick auto-allocation.
- **Credit / Debit Note Creation Workflow**: Source invoice reference picker with remaining quantity validation.

### 5.5 APIs Required
- `POST /api/v1/organizations/:orgId/transactions/sales`
- `GET /api/v1/organizations/:orgId/transactions/:id`
- `GET /api/v1/organizations/:orgId/transactions/:id/pdf`
- `POST /api/v1/organizations/:orgId/transactions/credit-notes`
- `POST /api/v1/organizations/:orgId/transactions/purchases`
- `POST /api/v1/organizations/:orgId/transactions/debit-notes`
- `POST /api/v1/organizations/:orgId/payments`

### 5.6 Dependencies
- Phases 1, 2, and 3 complete.
- Headless browser: Puppeteer / Chromium container for PDF output.

### 5.7 Testing Checklist
- [ ] Concurrent invoice creation requests never yield duplicate document numbers.
- [ ] Invoices with inclusive and exclusive VAT calculate exact identical totals as manual tax calculations.
- [ ] Transaction posting atomically rolls back if any step (e.g. stock movement or ledger entry) fails.
- [ ] Replaying an identical `Idempotency-Key` returns the original cached response without re-executing business logic.
- [ ] Sales returns reject items exceeding original unreturned billed quantities.

### 5.8 Completion Criteria
Users can create, preview, print, and post complete sales invoices and purchase bills with automatic stock deductions, payment settlements, and PDF generation.

---

## 6. Phase 5: Financial Accounting & Double-Entry Ledger

### 6.1 Scope & Objective
Establish the general ledger accounting system: Chart of Accounts, manual Journal Entries, Cash and Bank Books, Account Ledgers, Accounts Receivable/Payable aging, and automated financial statement generation (Trial Balance, Profit & Loss, Balance Sheet).

### 6.2 Database Work
- Implement collections: `accounts`, `journal_entries`, `ledgers`.
- Deploy compound multikey indexes:
  - `journal_entries`: `{ organizationId: 1, "lines.accountId": 1, date: -1 }`.
  - `accounts`: Unique `{ organizationId: 1, code: 1 }`.
  - `ledgers`: Unique `{ organizationId: 1, accountId: 1 }`.

### 6.3 Backend Tasks
- **Chart of Accounts Generator**: Seeds standardized Nepal accounting structure (1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Revenue, 5xxx Expenses) on organization creation.
- **Journal Posting Engine**:
  - Enforces mathematical balance: $\sum \text{Debits} \equiv \sum \text{Credits}$.
  - Supports manual journal vouchers for period-end adjustments.
  - Immutability rule: posted journals cannot be updated or deleted; reversing entries are required.
- **Ledger & Cash/Bank Book Engine**: Chronological debit/credit stream generation with running balance calculation.
- **Financial Statement Generator**:
  - **Trial Balance**: Aggregate account balances verifying global equality.
  - **Profit & Loss**: Categorizes Revenues (4xxx) minus Expenses (5xxx) over a date range.
  - **Balance Sheet**: Assets (1xxx) = Liabilities (2xxx) + Equity (3xxx) as of a cutoff date.
- **Aging Analysis Service**: Buckets open invoices into Current, 1-30, 31-60, 61-90, 90+ days past due.

### 6.4 Frontend Tasks
- **Chart of Accounts Tree View**: Interactive hierarchical tree allowing custom sub-account creation.
- **Journal Voucher Entry Screen**: Grid allowing multi-line debit/credit distribution with live balance indicator.
- **Account Ledger Statement**: Interactive table displaying transaction dates, voucher IDs, narrations, debits, credits, and running balances.
- **Cash & Bank Books UI**: Visual register of cash-in-hand and bank balances with clearance indicators.
- **Financial Statements Views**: Responsive Profit & Loss and Balance Sheet with drill-down capabilities into source journals.

### 6.5 APIs Required
- `GET / POST /api/v1/organizations/:orgId/accounting/accounts`
- `POST /api/v1/organizations/:orgId/accounting/journals`
- `GET /api/v1/organizations/:orgId/accounting/ledgers/:accountId`
- `GET /api/v1/organizations/:orgId/accounting/cash-book`
- `GET /api/v1/organizations/:orgId/accounting/bank-book`
- `GET /api/v1/organizations/:orgId/reports/trial-balance`
- `GET /api/v1/organizations/:orgId/reports/profit-loss`
- `GET /api/v1/organizations/:orgId/reports/balance-sheet`

### 6.6 Dependencies
- Phases 1, 2, and 4 complete.

### 6.7 Testing Checklist
- [ ] Attempting to post an unbalanced journal voucher ($\text{Debits} \neq \text{Credits}$) returns HTTP 422.
- [ ] Trial balance debit sum equals credit sum across all transactions.
- [ ] Profit & Loss net income flows correctly into the Balance Sheet retained earnings section.
- [ ] Cash/Bank book balances match physical cash/bank account totals.

### 6.8 Completion Criteria
The double-entry ledger operates with mathematical precision, automatically recording transaction effects and producing verifiable financial reports.

---

## 7. Phase 6: Reports, Dashboards & Document Generation

### 7.1 Scope & Objective
Deliver operational and statutory reporting capabilities, including executive sales dashboards, inventory aging, customer/supplier statements, the statutory Nepal IRD VAT Register (Annex 5), and background asynchronous export jobs.

### 7.2 Database Work
- Implement collections: `report_sales_daily`, `report_vat_periods`, `financial_statements_snapshots`.
- Setup scheduled materialization triggers updating daily sales and VAT snapshots overnight.

### 7.3 Backend Tasks
- **Nepal IRD VAT Register Engine**:
  - Implements statutory Annex 5 format: Taxable Sales, Tax-Exempt Sales, 13% Output VAT collected, Taxable Purchases, Claimable Input VAT.
  - Net VAT Payable/Refundable calculation.
- **Dashboard Metric Aggregator**: Calculates sales, collections, receivables, low-stock counts, and margins within 200ms using pre-aggregated projections.
- **Export Queue Worker**: BullMQ worker compiling multi-thousand-row Excel (.xlsx) and PDF reports offloaded to background workers.

### 7.4 Frontend Tasks
- **Executive Dashboard**: Key stat cards (Sales, Purchases, Cash, Bank, Receivables, Payables), trend charts, and quick-action widgets.
- **VAT Register View**: IRD Annex 5 formatted table with export to Excel/PDF.
- **Party Statement Viewer**: Customer ledger with running balance, aging summary, and shareable link generator.
- **Export Center UI**: Download center tracking progress of asynchronous report exports.

### 7.5 APIs Required
- `GET /api/v1/organizations/:orgId/reports/dashboard`
- `GET /api/v1/organizations/:orgId/reports/vat`
- `GET /api/v1/organizations/:orgId/reports/sales`
- `GET /api/v1/organizations/:orgId/reports/purchases`
- `GET /api/v1/organizations/:orgId/reports/stock-summary`
- `POST /api/v1/organizations/:orgId/reports/export`

### 7.6 Dependencies
- Phases 1 through 5 complete.
- Export tooling: `exceljs`, BullMQ, Redis.

### 7.7 Testing Checklist
- [ ] VAT register taxable and tax amounts match posted sales and purchase transactions.
- [ ] Dashboard analytics load under 200ms using materialized daily projections.
- [ ] Excel export contains formatted formulas, headers, and correct decimal representation.
- [ ] Exporting 10,000+ records via background worker executes without memory leaks or server lag.

### 7.8 Completion Criteria
Business owners can view real-time executive metrics, download statutory Nepal VAT reports, and export large data sheets.

---

## 8. Phase 7: Production Readiness, Security & DevOps

### 8.1 Scope & Objective
Execute comprehensive hardening, automated testing, load testing, containerization, SSL termination, reverse proxy setup, encrypted automated database backups, and health monitoring.

### 8.2 Database Work
- Validate production indexes using MongoDB `explain("executionStats")` asserting zero `COLLSCAN` operations on core queries.
- Configure automated database backup script: `mongodump --archive --gzip --oplog` with daily S3 uploads and 7-year monthly retention.
- Conduct simulated disaster recovery restore verifying database integrity.

### 8.3 Backend & Security Hardening
- **Security Audit**:
  - Enforce Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options.
  - Run `npm audit` and Snyk security scans; remediate all high/critical vulnerabilities.
  - Implement IP rate limiting on authentication routes.
- **Performance Optimization**: Enable Gzip/Brotli compression, database connection tuning, and memory optimization.
- **Observability**: Expose `/healthz`, `/readyz`, and Prometheus `/metrics` endpoints.

### 8.4 Frontend Hardening
- **Production Asset Bundling**: Vite code-splitting and asset optimization producing bundles under 200KB initial load.
- **Accessibility & Cross-Browser Verification**: Ensure WCAG 2.2 AA compliance, responsive mobile styling, and compatibility with Chrome, Safari, Firefox, and Edge.

### 8.5 Deployment Infrastructure
- Construct production multi-stage `Dockerfile` running as non-root user (`USER node`).
- Configure Nginx reverse proxy with TLS 1.3, HTTP/2, Let's Encrypt automated SSL renewal, and static asset caching.
- Deploy orchestrator stack via `docker-compose.prod.yml`.

### 8.6 Testing Suite Execution
- **Unit Tests**: Minimum 85% coverage on calculation pipeline, tax engine, and unit conversions (`vitest` / `jest`).
- **Integration Tests**: Supertest API integration tests covering full lifecycle (invoice creation -> journal creation -> stock movement -> payment allocation).
- **Load Testing**: k6 load test asserting 500 concurrent users with 95th percentile latency < 500ms.

### 8.7 Completion Criteria
The system passes all security scans, load tests, and disaster recovery drills, fully containerized and operational under HTTPS.

---

## 9. Milestone Schedule & Critical Path Analysis

### 9.1 Phase Delivery Matrix

| Phase | Milestone Name | Key Deliverables | Prerequisite |
|---|---|---|---|
| **Phase 1** | Foundation & Core Infra | Monorepo, Auth, RBAC, DB Connection, Logging | None |
| **Phase 2** | Organization & Master Data | Tenancy, Firms, Parties, Items, Units, VAT Policies | Phase 1 |
| **Phase 3** | Inventory & Stock Subledger | Warehouses, Movements, Weighted Average Costing | Phase 2 |
| **Phase 4** | Sales & Purchase Engine | Invoicing, Bills, Payments, Credit/Debit Notes, PDF | Phase 3 |
| **Phase 5** | Double-Entry Accounting | General Journal, Ledger, Cash/Bank Books, P&L, Balance Sheet | Phase 4 |
| **Phase 6** | Reports & Dashboards | Nepal VAT Register, Analytics, Excel/PDF Exports | Phase 5 |
| **Phase 7** | Production Readiness | Docker, Nginx, SSL, Security Hardening, Backup, DR | Phase 6 |

### 9.2 Critical Path Items
1. **Decimal Precision Infrastructure (Phase 1)**: Must be finalized first to prevent any floating-point numbers in the codebase.
2. **Multi-Tenant Context (Phase 2)**: Mandatory before transactional tables are built to guarantee complete data isolation.
3. **Atomic Journal & Stock Transaction Engine (Phase 4)**: The core financial mechanism linking sales and purchases to accounting and inventory.

---

*End of Smart Billing ERP Production Implementation Plan v1.0*
