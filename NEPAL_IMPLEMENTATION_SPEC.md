# Nagarik Billing: Nepal Implementation Specification

## 1. Product boundary

Nagarik Billing is an online-first, multi-tenant billing and bookkeeping application for Nepalese small businesses.

The first release supports:

- Organizations, companies/firms, branches, users, roles, and fiscal years
- NPR billing with Nepal time and calendar preferences
- PAN/VAT business configuration
- Customers and suppliers
- Items, services, units, categories, and opening stock
- Sales, purchases, receipts, payments, expenses, other income, and returns
- Cash and bank accounts
- VAT and configurable withholding/TDS foundations
- Invoice PDF, printing, export, and audit history
- Party, stock, cash, tax, and accounting reports

Manufacturing, loyalty, catalogue, lending, payment links, deep integrations, and offline synchronization are post-MVP.

Tax rates, tax labels, invoice wording, and IRD integration requirements must be verified against current Nepal Inland Revenue Department guidance before production release.

## 2. Fixed regional defaults

| Setting | Default |
|---|---|
| Currency | NPR |
| Timezone | Asia/Kathmandu |
| Internal date storage | Gregorian date and UTC timestamp |
| Display calendars | Gregorian and Bikram Sambat |
| Invoice languages | English, Nepali, or bilingual |
| Fiscal year | Configurable Nepal fiscal-year dates |
| Money precision | Decimal, currency scale configurable |

Bikram Sambat conversion belongs at the presentation boundary. Reports and database queries use unambiguous Gregorian dates internally.

## 3. Core domain entities

### Tenant and access

- `organizations`
- `firms`
- `branches`
- `financial_years`
- `users`
- `company_users`
- `roles`
- `permissions`
- `audit_events`

Every tenant-owned row includes `organization_id`. Every financial mutation records actor, timestamp, and request correlation ID.

### Masters

- `parties`
- `party_addresses`
- `party_groups`
- `items`
- `item_categories`
- `units`
- `unit_conversions`
- `tax_registrations`
- `tax_policies`
- `tax_rates`
- `withholding_rules`

A party can act as customer, supplier, or both. Items and services share a catalog contract but only stock-controlled items create inventory movements.

### Documents and accounting

- `transactions`
- `transaction_lines`
- `line_taxes`
- `document_charges`
- `document_sequences`
- `document_links`
- `accounts`
- `journal_entries`
- `journal_lines`
- `payment_allocations`
- `cash_bank_accounts`
- `stock_movements`
- `attachments`
- `idempotency_keys`
- `outbox_events`

## 4. Posting rules

A transaction is either `draft` or `posted`. Drafts may be edited. Posted transactions are corrected through reversal or approved adjustment; they are never silently rewritten.

### Sale invoice

On posting, in one database transaction:

1. Recalculate quantity, unit conversion, discounts, taxes, charges, round-off, and total on the server.
2. Validate organization, firm, fiscal year, permissions, sequence, item availability, and customer credit policy.
3. Create the receivable or cash/bank debit.
4. Create revenue credits.
5. Create tax credits for applicable tax lines.
6. Create stock-out movements and cost-of-goods entries for stock-controlled items.
7. Create payment allocations for amounts paid immediately.
8. Create the immutable audit event and outbox event.

The posting must fail completely if any step fails.

### Purchase bill

On posting:

- Debit inventory, expense, or asset accounts as applicable.
- Debit recoverable tax where configured.
- Credit supplier payable or cash/bank.
- Create stock-in movements for stock-controlled items.

### Receipt and payment

A receipt debits cash/bank and credits the party receivable account. A payment debits the party payable or expense account and credits cash/bank.

Allocations may settle invoices or remain as explicitly labelled advances. Allocation cannot exceed outstanding balance unless overpayment is intentionally enabled.

### Returns and reversals

Returns should reference the source document when possible. They must not exceed the remaining eligible quantity, including free quantity.

A reversal creates compensating journal and stock movements and preserves the original document, reason, actor, and timestamp.

## 5. Calculation contract

The server uses this order:

1. Normalize quantity and unit conversion.
2. Calculate line gross amount.
3. Apply line discounts.
4. Determine taxable base.
5. Calculate line tax using the versioned tax policy.
6. Aggregate lines.
7. Apply document discounts and charges.
8. Calculate configured withholding or collection amounts.
9. Apply round-off.
10. Calculate grand total, paid amount, and balance.

Persist the inputs, tax policy version, rounding adjustment, and calculated outputs on the posted document. Never recalculate a historic invoice using current settings.

## 6. Initial API boundary

```text
POST   /api/v1/auth/login
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:organizationId/settings
PATCH  /api/v1/organizations/:organizationId/settings
GET    /api/v1/organizations/:organizationId/parties
POST   /api/v1/organizations/:organizationId/parties
GET    /api/v1/organizations/:organizationId/items
POST   /api/v1/organizations/:organizationId/items
GET    /api/v1/organizations/:organizationId/transactions
POST   /api/v1/organizations/:organizationId/transactions
POST   /api/v1/organizations/:organizationId/transactions/:id/post
POST   /api/v1/organizations/:organizationId/transactions/:id/reverse
POST   /api/v1/organizations/:organizationId/payments
GET    /api/v1/organizations/:organizationId/reports/:reportKey
POST   /api/v1/organizations/:organizationId/imports
GET    /api/v1/organizations/:organizationId/audit-events
```

Financial creates and posting requests require an idempotency key. All endpoints return stable error codes and field-level validation errors.

## 7. MVP screens

- Sign in and company selection
- Company and Nepal tax setup
- Dashboard
- Parties list and party statement
- Items and stock list
- New sale invoice
- New purchase bill
- Receipt, payment, expense, and return forms
- Cash and bank accounts
- Transaction list and transaction detail
- Invoice preview and print view
- Reports
- Import/export
- Users, permissions, settings, and audit log

Desktop forms should support keyboard-first table entry. Mobile users must retain access to search, create, save draft, post, and share invoice actions.

## 8. Acceptance tests

The MVP is acceptable only when these tests pass:

- A Nepal company can be created with PAN, VAT status, NPR, fiscal year, timezone, and language.
- A sale posts balanced journal lines.
- A VAT-inclusive and VAT-exclusive invoice produce independently verified totals.
- Sale posting updates party balance, cash/bank, tax, revenue, and stock atomically.
- A purchase, receipt, payment, expense, and return reconcile independently.
- A posted document can be reversed without deleting its history.
- Concurrent invoice creation cannot duplicate a branch/document sequence.
- A return cannot exceed eligible source quantity.
- Historical documents retain their original tax policy and display values.
- Bikram Sambat display does not change the underlying accounting date.
- Direct API calls cannot bypass role restrictions.
- One organization cannot read or mutate another organization's data.
- Import preview identifies invalid rows before posting any records.
- Retrying an import or financial create with the same idempotency key does not duplicate data.
- Report totals reconcile to journal and stock facts.
- Generated PDF totals and labels match the posted document snapshot.

## 9. Build order

1. Repository, environments, database migrations, CI, and observability
2. Authentication, tenancy, roles, audit, and fiscal years
3. Decimal utilities, tax policy, chart of accounts, journal posting, and tests
4. Parties, items, units, opening balances, and opening stock
5. Sale-to-report vertical slice
6. Purchases, payments, expenses, income, and returns
7. Cash/bank, invoices, PDFs, imports, exports, and reports
8. TDS/withholding, branches, stores, and operational controls
9. IRD and payment integrations after compliance and API contracts are confirmed
