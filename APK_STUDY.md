# Vyapar APK study for a future web application

## Scope and provenance

- APK: `Vyapar v20.0.0 b595 arm7+arm64 Patched by youarefinished.apk`
- Package: `in.android.vyapar`
- Version: `20.0.0` (`versionCode 595`)
- Android range: minimum SDK 21, target/compile SDK 34
- SHA-256: `4028122A869CBA9CF49DDF6F5325EDAA758CCCEAA51A65DEB6FC645344709D6C`
- Archive: 10,379 entries, six DEX files, ARMv7 and ARM64 native libraries
- Decompiled output: 41,015 files under `.apk-analysis/jadx`
- Decompiled with JADX 1.5.5. JADX reported 296 method-level errors among roughly 30,940 processed classes; resources and most named application code decoded successfully.

This is a patched, third-party-resigned build. The signature files are named `YOUAREFINISHED.*`, and the APK includes protection/native components such as `libjiagu.so`. Product behavior, labels, and screen structure are useful reference material, but patch-specific code, keys, endpoints, certificates, and bypasses must not become part of the future product.

## Product model

Vyapar is a local-first bookkeeping, invoicing, inventory, and lightweight business-management system aimed at small businesses. Its central model is:

1. A user owns or joins one or more companies.
2. Each company has firms/branches, parties, items/services, accounts, settings, users, and a financial year.
3. Transactions change party balances, cash/bank balances, inventory, taxes, and reports together.
4. Most bookkeeping works locally; optional sync/share, cloud backup, online catalogues, payment links, reminders, and scheduled reports depend on backend services.

The default bottom navigation is **Home**, **Dashboard**, **Items**, and **Menu**. A restricted salesman role sees Home, Items, and Menu without the dashboard.

## Functional inventory

### Onboarding, identity, and companies

- Pre-sign-up variants, phone/OTP verification, sign-up, and first-sale onboarding
- Business profession, category, objective, and financial-year setup
- Company create/edit/select/delete, default-company selection, and multi-company management
- Multiple firms under a company, with shared parties/inventory and separate identities, logos, addresses, bank details, and document prefixes
- Business profile: name, address, contact, email, tax identity, logo, signature, business type, and regional tax configuration
- Passcode and biometric/fingerprint gates
- Premium plans, license attachment/upgrade, add-ons, referral rewards, partner store, and feature upsells

### Parties and receivables/payables

- Customers and suppliers in one party ledger model
- Party name, phone, email, billing/shipping addresses, GSTIN/TIN/VATIN, opening balance, credit limit, custom fields, notes, and groups
- Import from contacts, Excel/file import, bulk operations, inactive/recycle behavior, and party review
- Party detail dashboard, ledger/statement, item-by-party history, receivable/payable status, and credit-limit warnings
- Party groups and group-level sales/purchase reporting
- Shareable party-detail request links and party-statement links
- Payment reminders through SMS/WhatsApp/share sheet; bulk reminder flows
- Loyalty balance, earning, redemption, expiry/settings, manual adjustment, and transaction history

### Items, services, and inventory

- Product/service item types
- Item name/code/barcode, description, category, image, manufacturer, location, HSN/SAC, tax, sale/purchase prices, discount, and custom fields
- Units and primary/secondary unit conversion
- Opening stock, minimum stock, stock value, low-stock alerts, add/reduce stock adjustment
- Batch and expiry tracking, serial-number tracking, free quantity, and party-specific last rates
- Barcode scan by phone camera or USB scanner; continuous and single scan modes
- Item import from XLS/XLSX, supplied templates, item library, export, bulk categorization/unit operations
- Multiple stores/godowns, per-store stock, and stock-transfer transactions/reports
- Fixed assets with opening balance and appreciation/depreciation adjustments
- Manufacturing/BOM: finished item, raw materials, output quantity, additional costs, default assembly, manufacturing transaction, and report
- Service reminders associated with items/services

### Transaction families

The transaction editor is configurable and reused across transaction families. The APK exposes:

- Sale invoice and cash sale
- Purchase bill
- Payment-in and payment-out
- Expense and other income
- Credit note / sale return
- Debit note / purchase return
- Estimate / quotation / proforma invoice, with open/closed state and conversion to sale
- Sale order and purchase order, with fulfilment state and conversion
- Delivery challan/delivery note, goods return, and conversion to sale
- Bank deposit/withdrawal, cash-to-bank, bank-to-cash, and bank-to-bank transfer
- Party-to-party transfer
- Stock adjustment and stock transfer
- Loan-account transactions, EMI payment, interest/expense, and statement
- Manufacturing transaction
- Job-work-out challan and purchase job-work
- Journal entry (paired received/paid ledger sides)

Common transaction capabilities include party selection, document number/prefix, date and due date/payment terms, line items, quantity/free quantity, units, rate, discount, tax, batch/serial data, additional charges, round-off, notes, terms, attachments, payment split, paid/balance amount, status, and document sharing/printing.

### Cash, bank, and online payments

- Cash-in-hand dashboard and manual adjustment
- Multiple bank accounts with opening/current balances
- Cheque list, cheque status/closure, and bank statement
- UPI ID/QR shown on invoices
- Online payment-account onboarding and KYC: account holder, account number, IFSC, PAN, GST, CIN, legal business name, and document upload/download
- Payment link generation and payment reminders
- Multiple payment modes/split payments

### Tax and compliance

- Indian GST configuration, GSTIN validation/lookup, regular/composition behavior, item-wise tax, reverse charge, HSN/SAC, tax rates, and place-of-supply concepts
- GSTR-1, GSTR-2, GSTR-3B, GSTR-4, GSTR-9, GSTR-9A, and GST transaction reports
- TCS management/reporting and TDS management/reporting
- VAT 201 return and localized Gulf terminology (for example, delivery note rather than challan)
- Invoice/bill numbers and per-document prefixes

The future web app should make tax rules jurisdiction-aware instead of baking Indian and Gulf rules into one transaction model.

### Reports and analytics

- Dashboard summaries for sales, purchases, expenses, receivables/payables, cash, bank, inventory, and profit
- Sale/purchase/expense report and party-wise sale/purchase report
- Day book, cash flow, profit and loss, balance sheet
- Bill-wise, item-wise, and party-wise profit/loss
- Party statement and outstanding transaction detail
- Sales/purchase aging
- Stock detail, stock/low-stock summary, item detail, item stock tracking, serial/batch reports
- Category/group reports and item-by-party/party-by-item reports
- Expense category/item reports and other-income/custom reports
- Bank statement, tax-rate, GST/VAT, TCS/TDS, HSN/SAC, order, manufacturing, stock-transfer, and online-store reports
- Date ranges and multi-select filters; print, PDF, Excel, and scheduled report delivery

### Documents, communication, and printing

- Invoice themes, colors, original/duplicate labels, custom headers, item-table widths/names, additional columns, logo, signature, terms, bank/UPI details, and print copies
- PDF preview, save, print, and share
- Thermal printing over Bluetooth and Wi-Fi, with printer discovery/store and item-column settings
- SMS, WhatsApp, email, and Android share-sheet delivery
- Custom transaction/reminder messages and WhatsApp greeting cards

### Backup, sync, security, and administration

- Manual backup to phone or email and automatic Google Drive backup
- Restore and close-books/archive workflows
- Optional multi-device auto-sync; offline editing becomes read-only in some sync failure states
- User invitation, user profiles, access revocation, login/password reset, and security logs
- Roles include admin and accountant variants plus a restricted salesman experience
- Granular capabilities visible in strings/code include viewing, creating, editing, and deleting transactions; changing settings; managing sync/users; backup rights; and profile editing
- Recycle bin with restore constraints such as duplicate invoice numbers

### Secondary/commercial modules

- Online catalogue/store, custom domain, item sharing, incoming orders, order status, views and order-value statistics
- IndiaMART integration
- Business loans, credit line, bureau/Experian credit-score flows, and FinBox lending integration
- Referral/scratch-card rewards, printer store, partner store, tutorials, app inbox, and “what's new” content

These are not core accounting and should be isolated from the web MVP.

## Screen and resource evidence

- Manifest components: 273 activities, 6 activity aliases, 23 services, 22 receivers, 6 providers, and 35 permission declarations
- UI resources: 1,532 layouts, 3,276 drawables, 68 menus, 2 navigation graphs, 72 animations, 16 animators, and 8,407 default strings
- The app is a hybrid of legacy activities/fragments/XML layouts and newer Kotlin, ViewModel, Hilt/Koin, coroutines, and Jetpack Compose screens.
- Feature packages include parties, items, expense, catalogue, barcode, cash-in-hand, bank/payment, reports, GST/TDS/TCS, manufacturing, stores, fixed assets, loyalty, service reminders, sync/share, user roles, recycle bin, thermal printing, loans, plans, and onboarding.
- Bundled assets include business types, empty-state animations, public keys, and sample XLS/XLSX item-import templates with and without stock.

## Data and invariants to preserve in a web implementation

The decompiled build is heavily obfuscated, so reconstructing every table name is less reliable than reconstructing domain behavior. The web schema should explicitly model these aggregates:

- `Organization/Company`, `Firm`, `FinancialYear`, `User`, `Role`, `Permission`, `SecurityEvent`
- `Party`, `PartyAddress`, `PartyGroup`, `PartyBalance`, `CreditLimit`, `LoyaltyAccount`
- `Item`, `Service`, `Category`, `Unit`, `UnitConversion`, `TaxCode`, `Price`, `Batch`, `Serial`, `Store`, `StockLot`, `StockMovement`
- `Transaction`, `TransactionLine`, `Charge`, `TaxLine`, `PaymentAllocation`, `Attachment`, `DocumentSequence`, `ConversionLink`
- `CashAccount`, `BankAccount`, `Cheque`, `Transfer`, `LoanAccount`, `LoanInstallment`
- `BOM`, `BOMLine`, `ManufacturingRun`, `FixedAsset`, `AssetAdjustment`
- `Reminder`, `NotificationDelivery`, `ReportSchedule`, `Backup/ExportJob`, `SyncChange`

Important invariants:

- Posted transactions must update ledger, payment balance, stock, and taxes atomically.
- Editing or deleting a posted transaction must create reversible audit effects, not silently rewrite balances.
- Document numbers are unique within their firm, document type, and financial-year sequence.
- Returns and challan returns cannot exceed eligible sold/delivered quantities, including free quantity.
- Unit conversions, batch/serial quantities, and store movements must balance.
- Payment allocations cannot exceed the outstanding amount unless overpayment/advance is explicitly modeled.
- Permissions must be enforced server-side for every mutation and sensitive report/export.
- Money should use decimal/fixed precision; never binary floating point.
- Closed financial years and archived books require explicit reopen/correction workflows.

## Network and external integrations observed

The main Retrofit contract contains routes for authentication, OTP, companies/users/sync, license/plans, catalogue, party invites and ledger links, payment accounts and links, payment reminders, GSTIN/IFSC lookup, loans/credit line, referral rewards, scheduled reports, WhatsApp notification, analytics dumps, and diagnostic database upload.

Observed services/SDKs include Firebase (analytics, database, messaging/crash reporting), CleverTap, Google Drive, Google sign-in/services, Facebook, Truecaller, WhatsApp, YouTube, IndiaMART, Experian, FinBox, and Razorpay-related links. The APK permits cleartext traffic and requests broad Android permissions (contacts, storage, camera, phone state, Bluetooth/location, notifications, overlay, network, wake lock, and boot receiver). A web app should request far less privilege and integrate each service through narrowly scoped server-side adapters.

Do not reuse extracted API keys, public-key files, backend URLs as an assumed contract, or the existing authentication mechanism. Define and secure a new API.

## Recommended web product boundary

### Phase 1: accounting MVP

1. Authentication, organization/company, firm, financial year, and role-based access
2. Parties and opening balances
3. Items/services, units, categories, taxes, and opening stock
4. Sale, purchase, payment-in/out, expense, and returns
5. Cash/bank accounts and transfers
6. PDF invoice, print/share/download
7. Party ledger, receivable/payable, sales/purchase, stock, day book, cash flow, and P&L reports
8. Import/export, audit log, backups, and responsive desktop/mobile UI

### Phase 2

- Estimates, orders, delivery challans and conversions
- Batch/serial tracking, multiple stores, stock transfers
- GST/TDS/TCS reports, scheduled reports, reminders, custom fields, and invoice designer
- Multi-user real-time collaboration and offline/PWA queueing

### Phase 3

- Manufacturing/BOM, fixed assets, loyalty, service reminders
- Online catalogue/store and payment links
- Lending, referral, marketplace, and other commercial integrations only if business requirements justify them

## Suggested web architecture

- Responsive React/Next.js or equivalent front end with an explicit transaction state machine
- API service with PostgreSQL, row-level organization scoping, and server-enforced RBAC
- Double-entry ledger underneath user-friendly transaction forms
- Immutable journal/audit records plus compensating reversals
- Inventory subledger driven by stock movements
- Background jobs for PDFs, imports, notifications, backups, and scheduled reports
- Object storage for logos, attachments, generated PDFs, and exports
- Outbox/event pattern so posting a transaction and scheduling downstream work cannot diverge
- Idempotency keys for creates/imports/payment callbacks
- Optional PWA local cache; conflict-aware synchronization only after the online model is stable

## What static analysis cannot prove

- Exact visual behavior on every device/state, remote feature flags, A/B tests, and server-controlled screens
- Live backend response shapes or current production rules
- Every database table relationship hidden by obfuscation/protection
- Whether patch code changed premium checks, licensing, security, or other behavior
- End-to-end printer, camera, Bluetooth, payment, and third-party-login behavior without running the APK on an Android device

For UI parity work, the next useful step is a controlled emulator/device walkthrough with screenshots and a state-by-state screen inventory. For implementation, the next useful step is to turn Phase 1 into user stories, workflows, and a normalized schema before writing UI code.
