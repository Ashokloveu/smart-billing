# SMART BILLING ERP SYSTEM
## Frontend UI & UX Design Specification
### Version 1.0 | September 2026

> **Derivation**: Synthesized from [SMART_BILLING_ERP_SRS.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_ERP_SRS.md), [SMART_BILLING_TECHNICAL_ARCHITECTURE.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_TECHNICAL_ARCHITECTURE.md), and [SMART_BILLING_IMPLEMENTATION_PLAN.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_IMPLEMENTATION_PLAN.md).  
> **Framework**: React 19 + TypeScript (SPA) + Pure Vanilla CSS (CSS Variables Design System).  
> **Status**: UI/UX Specification & Screen Contract Blueprint (Design Only — No Application Code).  
> **Design Philosophy**: High-density desktop efficiency, keyboard-first data entry, dual Gregorian/Bikram Sambat calendars, South Asian currency formatting (`NPR 1,23,456.78`), and WCAG 2.2 AA accessibility.

---

## Table of Contents

1. [Global Design System, Typography & Color Tokens](#1-global-design-system-typography--color-tokens)
2. [Global Application Layout](#2-global-application-layout)
   - 2.1 AppShell Layout
   - 2.2 Collapsible Sidebar Navigation
   - 2.3 Universal Header & TopBar
   - 2.4 Breadcrumb Trail & Page Header
   - 2.5 Notification Center & Activity Drawer
   - 2.6 User Profile, Branch Selector & Theme Switcher
3. [Executive Dashboard UI](#3-executive-dashboard-ui)
4. [Reusable Design System Components](#4-reusable-design-system-components)
   - 4.1 `DataTable` (Virtualized Enterprise Grid)
   - 4.2 `SearchInput` & Global Quick Finder
   - 4.3 `PaginationControl`
   - 4.4 `ModalDialog` & `DrawerPanel`
   - 4.5 `ConfirmDialog`
   - 4.6 `CurrencyInput` (Money Input)
   - 4.7 `DualDatePicker` (Gregorian & Bikram Sambat)
   - 4.8 `FileUploader`
5. [Authentication Screens](#5-authentication-screens)
   - 5.1 Sign In Screen
   - 5.2 Multi-Factor Authentication (TOTP 2FA) Screen
   - 5.3 Password Recovery Screen
6. [Master Data Screens](#6-master-data-screens)
   - 6.1 Customer & Supplier Management Screens
   - 6.2 Product & Service Catalog Screens
   - 6.3 Category & Unit Management Screens
   - 6.4 Tax Policy Configuration Screen
7. [Sales & POS Screens](#7-sales--pos-screens)
   - 7.1 Sales Invoice Creation Screen (Standard B2B)
   - 7.2 Point-of-Sale (POS) Express Billing Screen
   - 7.3 Invoice Detail, A4 PDF Preview & ESC/POS Thermal Print
   - 7.4 Sales Return (Credit Note) Screen
8. [Purchase Screens](#8-purchase-screens)
   - 8.1 Purchase Bill Creation Screen
   - 8.2 Supplier Payment Settlement Screen
   - 8.3 Purchase Return (Debit Note) Screen
9. [Inventory Management Screens](#9-inventory-management-screens)
   - 9.1 Live Stock Balances & Warehouse Dashboard
   - 9.2 Stock Adjustment Screen
   - 9.3 Inter-Warehouse Stock Transfer Screen
   - 9.4 Stock Movement Card (Item Ledger)
10. [Financial Accounting Screens](#10-financial-accounting-screens)
    - 10.1 Interactive Chart of Accounts Screen
    - 10.2 General Journal Voucher Entry Screen
    - 10.3 General Ledger Statement Screen
    - 10.4 Cash Book & Bank Book Registers
11. [Reports & Analytics Screens](#11-reports--analytics-screens)
    - 11.1 Nepal IRD VAT Register (Annex 5) Screen
    - 11.2 Profit & Loss Statement Screen
    - 11.3 Balance Sheet Screen
    - 11.4 Inventory Valuation & Aging Reports

---

## 1. Global Design System, Typography & Color Tokens

### 1.1 Color Palette Tokens (Pure CSS Variables)
```css
:root {
  /* Surface & Background */
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-subtle: #f1f5f9;
  --border-default: #e2e8f0;
  --border-focus: #3b82f6;

  /* Typography */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;

  /* Brand Accents */
  --primary: #1e3a8a;        /* Deep Sapphire */
  --primary-hover: #1e40af;
  --primary-light: #eff6ff;

  /* Semantic Status Colors */
  --success: #059669;        /* Emerald (Paid, In Stock) */
  --success-bg: #ecfdf5;
  --warning: #d97706;        /* Amber (Pending, Due, Low Stock) */
  --warning-bg: #fffbeb;
  --danger: #dc2626;         /* Crimson (Overdue, Out of Stock, Reversed) */
  --danger-bg: #fef2f2;
  --info: #0284c7;           /* Sky Blue (Draft, Info) */
  --info-bg: #f0f9ff;
}

[data-theme="dark"] {
  --bg-app: #0b0f19;
  --bg-surface: #111827;
  --bg-subtle: #1f2937;
  --border-default: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --primary-light: #1e293b;
}
```

### 1.2 Typography
- **Primary Latin & Digits**: `Inter, system-ui, -apple-system, sans-serif`.
- **Devanagari (Nepali Script)**: `Noto Sans Devanagari, sans-serif`.
- **Monospace (SKUs, Sequences, Numbers)**: `JetBrains Mono, Fira Code, monospace`.
- **Font Scale**: Display (28px), Title (20px), Body (14px), Caption/Table (13px), Badge (11px).

---

## 2. Global Application Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TopBar: [Org/Branch Switcher] [Quick Search Cmd+K] [Date/BS Toggle]  [Bell (3)] [User Avatar]    │
├─────────────────┬────────────────────────────────────────────────────────────────────────────────┤
│ Sidebar         │ Breadcrumbs: Home / Sales / Invoices / New Invoice                             │
│ ─────────────── │ Page Header: Create Sales Invoice                [Save Draft] [Post Invoice]   │
│ 📊 Dashboard    ├────────────────────────────────────────────────────────────────────────────────┤
│ 🛒 Sales        │ Main Content Work Area                                                         │
│ 📦 Purchases    │ (Forms, Tables, Virtualized Grids, Analytics)                                  │
│ 🏷️ Master Data  │                                                                                │
│ 🏬 Inventory    │                                                                                │
│ 📑 Accounting   │                                                                                │
│ 📈 Reports      │                                                                                │
│ ⚙️ Settings     │                                                                                │
└─────────────────┴────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 AppShell Layout
- CSS Grid with fixed header (60px), sticky collapsible sidebar (240px open, 64px collapsed), and responsive content pane.
- Responsive Breakpoints: Desktop (>= 1280px), Tablet/POS (768px - 1279px), Mobile (< 768px).

### 2.2 Collapsible Sidebar Navigation
- Groups: Operations (Sales, Purchases, POS), Resources (Parties, Items, Inventory), Finance (Accounting, Reports), Administration (Settings, Audit).
- Features: Active route indicator, shortcut badges, collapse toggle button at the footer.

### 2.3 Universal Header & TopBar
- **Company / Branch Selector**: Dropdown showing active firm and fiscal period with one-click switching.
- **Global Command Palette (`Cmd + K`)**: Modal searching customers, items, recent invoices, and menu actions.
- **Calendar Mode Switcher**: Quick toggle switching displays between Gregorian (AD) and Bikram Sambat (BS).
- **Branch Indicator**: Pill showing current active branch (`"Kathmandu Main Branch"`).

### 2.4 Breadcrumb Trail & Page Header
- Context-aware path navigation with clickable ancestors.
- Page Header: Title, subtitle/status pill, and primary action buttons (e.g. `+ New Invoice`, `Export`).

### 2.5 Notification Center & Activity Drawer
- Slide-over right drawer displaying unread alerts (Low stock warnings, overdue payment reminders, background backup completion).
- Mark-as-read toggles and direct deep-links to associated transaction records.

### 2.6 User Profile, Branch Selector & Theme Switcher
- Flyout menu: Active user info, assigned role badge, "Switch Theme" toggle (Light/Dark/System), "Profile Settings", and "Logout".

---

## 3. Executive Dashboard UI

- **Purpose**: Real-time high-level visibility into business health, cash flows, inventory positions, and tax liabilities.
- **User Roles**: Owner, Admin, Accountant.
- **Layout**: 4-column KPI cards + 2-column analytics charts + split table widgets.

### 3.1 Components & KPI Cards
| Metric Card | Value Display | Subtext / Indicator | Visual Treatment |
|---|---|---|---|
| **Today's Sales** | `NPR 1,48,500.00` | `+14.2% vs yesterday` (green badge) | Sapphire background accent |
| **Total Receivables**| `NPR 12,40,000.00` | `48 Overdue Invoices` | Amber warning badge |
| **Total Payables** | `NPR 8,20,000.00` | `12 Bills Due this week` | Subtle slate card |
| **Net Cash in Hand**| `NPR 3,15,400.00` | `Bank: NPR 28,40,000.00` | Emerald success accent |

### 3.2 Visual Charts & Grids
- **Revenue vs Expense Trend**: Dual-line chart with 7-day, 30-day, and Fiscal Year toggles.
- **Inventory Stock Alert Panel**: List of top items where `currentStock <= minimumStock` with a 1-click "Create PO" button.
- **Receivable Aging Breakdown**: Bar visual displaying Current, 1-30 days, 31-60 days, 61-90 days, and 90+ days past due.
- **Recent Transaction Feed**: Live table showing last 10 posted invoices with customer name, payment status pill, and print button.

---

## 4. Reusable Design System Components

### 4.1 `DataTable` (Virtualized Enterprise Grid)
- **Props**: `columns`, `data`, `isLoading`, `isError`, `totalCount`, `pagination`, `onRowClick`, `bulkActions`.
- **Capabilities**:
  - Virtualized row rendering (`@tanstack/react-virtual`) handling 10,000+ records at 60fps.
  - Multi-column sorting, sticky header row, sticky left checkbox column for bulk operations.
  - Resizable column dividers and column visibility dropdown.
  - States: Skeleton rows while loading; zero-data illustration on empty; inline error banner on failure.

### 4.2 `SearchInput` & Global Quick Finder
- Debounced search input (300ms) with clear button (`✕`) and keyboard shortcut indicator (`/` or `Cmd+K`).
- Autocomplete dropdown displaying grouped results (Customers, Products, Invoices).

### 4.3 `PaginationControl`
- Server-side pagination bar displaying: "Showing 1-25 of 1,420 items", items-per-page dropdown (10, 25, 50, 100), page number buttons with ellipsis, and Jump-to-Page input.

### 4.4 `ModalDialog` & `DrawerPanel`
- Accessible overlay with ESC key dismiss, focus trap, customizable widths (sm: 400px, md: 600px, lg: 900px, xl: 1200px), header with close icon, and sticky footer for actions.

### 4.5 `ConfirmDialog`
- Alert modal for destructive operations (e.g. "Reverse Invoice", "Deactivate User") with explicit warning text, red primary button, and required confirmation checkbox for irreversible actions.

### 4.6 `CurrencyInput` (Money Input)
- Input restricted to positive decimal numbers.
- Auto-formats on blur using South Asian currency format: `NPR 1,23,456.78`.
- Exposes raw decimal string to form controllers to avoid JavaScript floating point errors.

### 4.7 `DualDatePicker` (Gregorian & Bikram Sambat)
- Segmented control toggling between AD and BS modes.
- BS Mode: Custom calendar grid displaying Nepali months (Baishakh to Chaitra) with corresponding Gregorian date displayed below.
- Keyboard accessible with quick-select presets ("Today", "This Fiscal Month", "Last Month", "This Fiscal Year").

### 4.8 `FileUploader`
- Drag-and-drop zone with MIME type filtering (e.g. `.pdf`, `.png`, `.xlsx`), maximum size enforcement (10MB), and progress bar indicator during upload.

---

## 5. Authentication Screens

### 5.1 Sign In Screen (`/auth/login`)
- **Purpose**: Authenticate user via email/phone and password.
- **Form Controls**:
  - `identifier`: Text input with email/phone auto-detection.
  - `password`: Masked password input with visibility toggle.
  - `rememberMe`: Checkbox.
- **Validation**:
  - Email/Phone required; password minimum 8 characters.
- **Actions**: "Sign In" primary button, "Forgot Password?" link.
- **States**: Spinner inside button on submit; red alert card on invalid credentials.

### 5.2 Multi-Factor Authentication Screen (`/auth/mfa/verify`)
- **Purpose**: Challenge screen when user has TOTP 2FA enabled.
- **Form Controls**: 6-digit split input box with auto-focus and auto-submit on 6th digit entry.
- **Actions**: "Verify & Continue", "Use Backup Code" modal trigger.

### 5.3 Password Recovery Screen (`/auth/forgot-password`)
- **Purpose**: Request OTP-based password reset link.
- **Form Controls**: Identifier input.
- **States**: Success state displays instruction banner to check registered email/phone.

---

## 6. Master Data Screens

### 6.1 Customer & Supplier Management Screens (`/parties`)
- **Purpose**: Complete management of counterparties, contact details, PAN/VAT info, and credit limits.
- **User Roles**: Owner, Admin, Accountant, Billing Operator.
- **Components**:
  - Top filter tabs: "All Parties", "Customers", "Suppliers".
  - Search bar + Group filter dropdown.
  - Action: `+ Add Party` button opening slide-in drawer.
- **Party Form Drawer**:
  - Type (Radio: Customer / Supplier / Both).
  - Legal Name, 9-digit PAN/VAT input with real-time numeric validation.
  - Phone, Email, Physical Address fields.
  - Credit Limit input (`CurrencyInput`), Opening Balance amount and date.
- **Table Columns**: Name, Type Badge, PAN, Phone, City, Credit Limit, Current Balance (red if over credit limit), Action menu.
- **Validation**: Name required, PAN must be exactly 9 digits if entered.

### 6.2 Product & Service Catalog Screens (`/items`)
- **Purpose**: Manage physical products and non-stock service items.
- **User Roles**: Owner, Admin, Accountant, Billing Operator.
- **Components**:
  - Metric summary chips: "Total SKUs", "Low Stock Alert (12)", "Out of Stock (3)".
  - Search bar (SKU, Name, Barcode) + Category filter.
  - Action: `+ Add Item` button opening modal.
- **Item Form Modal**:
  - Type toggle (Product / Service).
  - Item Name, SKU/Code (auto-generated or custom), Barcode (scan-ready).
  - Category dropdown, Primary Unit selector, Secondary Unit selector with conversion ratio.
  - HSN/SAC Code input, Tax Policy selector (Default: Nepal VAT 13%).
  - Sales Price, Purchase Cost Price.
  - Stock Tracking toggle, Minimum Stock Alert threshold.
- **Table Columns**: Code, Item Name, Category, Primary Unit, Selling Price, Purchase Cost (hidden for Salesperson role), In Stock Qty, Status Badge, Actions.

---

## 7. Sales & POS Screens

### 7.1 Sales Invoice Creation Screen (`/sales/invoices/new`)
- **Purpose**: B2B standard sales invoice entry supporting complex lines, terms, discounts, and payment splits.
- **User Roles**: Owner, Admin, Accountant, Billing Operator.
- **Components**:
  - Document Header Card: Firm/Branch, Invoice Sequence Number (auto), Transaction Date (`DualDatePicker`), Due Date, Customer Picker (`PartySelect` with live balance and credit warning).
  - **Editable Line Item Table (`LineItemTable`)**:
    - Columns: `#`, `Item / Description` (Search + Barcode), `Warehouse`, `Qty`, `Unit`, `Rate`, `Discount (Amt/%)`, `Taxable Base`, `VAT (13%)`, `Line Total`, `Actions (Trash)`.
    - Keyboard Navigation: Tab advances cells; Enter on last cell creates a new line row.
  - **Document Summary Footer**:
    - Left side: Customer Notes, Terms & Conditions dropdown, Attachment uploader.
    - Right side (`DocumentTotals`): Subtotal, Document Discount, Shipping / Extra Charges, Nepal 13% VAT aggregate, Round-off adjustment, Grand Total (large display).
  - **Payment Collection Split Bar**: Cash / Bank / Cheque allocation with immediate receipt booking.
- **Actions Bar**: `Save as Draft`, `Post Invoice`, `Post & Print (A4)`, `Cancel`.
- **Validation Rules**:
  - Minimum 1 item line required.
  - Qty > 0, Rate >= 0.
  - If Customer Credit Limit exceeded: modal prompt requires manager override confirmation.

### 7.2 Point-of-Sale (POS) Express Billing Screen (`/pos`)
- **Purpose**: Rapid retail counter billing optimized for touch screens and barcode scanners.
- **User Roles**: Billing Operator, Salesperson.
- **Layout**: 60% Left side: Product visual tiles & quick barcode entry. 40% Right side: Active shopping cart and tender panel.
- **Components**:
  - Barcode Scanner input box: Keystrokes auto-add items to cart with single scan.
  - Quick Category filter chips (e.g. "Beverages", "Cement", "Hardware").
  - Quick Tender buttons: `Exact Cash`, `NPR 500`, `NPR 1000`, `Fonepay / QR`, `Card`.
  - Change Return Calculator: Computes customer cash change in real time.
- **Actions**: Big green `[F12] Complete Sale & Print ESC/POS` button.

### 7.3 Invoice Detail, A4 PDF Preview & ESC/POS Thermal Print
- **Purpose**: Render legal tax invoice conforming to Nepal IRD standards.
- **Components**:
  - Action header: `Print A4`, `Print 80mm Thermal`, `Download PDF`, `Send WhatsApp/SMS`, `Create Return`.
  - Invoice Preview Pane:
    - Seller Details: Name, Branch, Address, PAN/VAT Number.
    - Buyer Details: Name, Address, PAN/VAT Number.
    - Invoice Number, Date (BS & AD), Payment Mode.
    - Table: Item Name, HSN Code, Qty, Rate, Taxable Amount, 13% VAT, Line Total.
    - Amount in words (English and Nepali Rupaiya).
    - Authorized Signatory stamp block.

### 7.4 Sales Return (Credit Note) Screen (`/sales/credit-notes/new`)
- **Purpose**: Issue credit note against a previously posted invoice.
- **Components**:
  - Source Invoice Selector: Auto-populates original line items.
  - Return Grid: Displays Billed Qty, Previously Returned Qty, Remaining Eligible Qty, and editable Current Return Qty input.
  - Reason code selector (Damaged Goods, Price Adjustment, Order Cancellation).
- **Validation**: Current Return Qty cannot exceed Remaining Eligible Qty.

---

## 8. Purchase Screens

### 8.1 Purchase Bill Creation Screen (`/purchases/bills/new`)
- **Purpose**: Inward vendor bill booking with Input Tax Credit (ITC) tracking and inventory replenishment.
- **User Roles**: Owner, Admin, Accountant.
- **Components**:
  - Supplier picker, Supplier Bill Number (vendor's physical invoice number), Purchase Date.
  - Line Item Grid: Items, destination Warehouse, Inward Quantity, Purchase Cost Rate, Tax policy.
  - Totals Card: Calculation of Claimable Input VAT.
- **Actions**: `Post Bill` (immediately increments inventory and credits Accounts Payable).

### 8.2 Supplier Payment Settlement Screen (`/purchases/payments`)
- **Purpose**: Record bank remittances or cash payments to suppliers against open bills.
- **Components**:
  - Supplier picker: Displays open unpaid purchase bills ordered by due date.
  - Amount input: Auto-allocates payment from oldest bill to newest (FIFO) with manual allocation override.
  - Payment Mode: Bank Account picker with Cheque Number and Reference fields.

---

## 9. Inventory Management Screens

### 9.1 Live Stock Balances & Warehouse Dashboard (`/inventory`)
- **Purpose**: Real-time multi-location inventory visibility.
- **Components**:
  - Warehouse selector filter ("All Godowns", "Balaju Warehouse", "New Road Store").
  - Metrics: Total Inventory Valuation (`CurrencyInput`), Low Stock Items Count, Negative Stock Items (if any).
  - Virtualized Table: SKU, Item Name, Category, Godown, On-Hand Qty, Weighted Average Unit Cost, Total Value, Reorder Status.
  - Fast Actions: "Adjust Stock", "Transfer Stock".

### 9.2 Stock Adjustment Screen (`/inventory/adjustments/new`)
- **Purpose**: Manual stock corrections for physical count variances or damage.
- **Form Controls**: Warehouse picker, Item picker, Adjustment Direction (Radio: Add (+) / Deduct (-)), Quantity, Reason dropdown (Breakage, Count Variance, Expired), Offset Ledger Account.

### 9.3 Inter-Warehouse Stock Transfer Screen (`/inventory/transfers/new`)
- **Purpose**: Move stock from one branch godown to another.
- **Form Controls**: Source Warehouse, Destination Warehouse, Date, Multi-item grid with quantity inputs.
- **Validation**: Source and destination warehouses must be different; source must have sufficient on-hand quantity.

### 9.4 Stock Movement Card (Item Ledger) (`/inventory/items/:id/ledger`)
- **Purpose**: Audit card tracing every historical movement of an individual product.
- **Table Columns**: Date (BS & AD), Transaction Type (Purchase, Sale, Transfer, Adjustment), Ref Doc Number, Warehouse, In Qty, Out Qty, Balance Qty, Unit Cost, Valuation.

---

## 10. Financial Accounting Screens

### 10.1 Interactive Chart of Accounts Screen (`/accounting/accounts`)
- **Purpose**: View and manage the hierarchical ledger accounts.
- **User Roles**: Owner, Admin, Accountant.
- **Components**:
  - Expandable Tree View:
    - `1000 ASSETS` -> `1100 Current Assets` -> `1110 Cash in Hand`, `1120 Bank Accounts`
    - `2000 LIABILITIES` -> `2120 VAT Payable`
    - `3000 EQUITY`
    - `4000 REVENUE` -> `4100 Sales Revenue`
    - `5000 EXPENSES` -> `5100 Cost of Goods Sold`
  - Right-side Detail Card: Account Code, Name, Subtype, System Account status, Current Balance.
  - Action: `+ Add Sub-Account` button (disabled on system accounts).

### 10.2 General Journal Voucher Entry Screen (`/accounting/journals/new`)
- **Purpose**: Record manual double-entry journal vouchers.
- **User Roles**: Owner, Accountant.
- **Components**:
  - Voucher Date (`DualDatePicker`), Journal Voucher Number (auto), Narration text box.
  - Journal Lines Grid:
    - Line item row: Account Selector, Description, Debit (`CurrencyInput`), Credit (`CurrencyInput`), Action (Trash).
    - Rule: Debit or Credit must be zero on each line.
  - Dynamic Balance Bar: Displays `Total Debits`, `Total Credits`, and `Difference`.
- **Validation Rules**:
  - Total Debits must exactly equal Total Credits (Difference = 0.00).
  - Minimum 2 lines required.
  - Action button `Post Journal` is disabled while Difference != 0.00.

### 10.3 General Ledger Statement Screen (`/accounting/ledgers`)
- **Purpose**: Chronological account statement with running balance.
- **Components**:
  - Account picker, Date Range filter (`DualDatePicker`).
  - Statement Table: Date, Voucher Type, Voucher No (clickable link), Narration, Debit, Credit, Running Balance.
  - Export: Download Excel / Print Statement.

---

## 11. Reports & Analytics Screens

### 11.1 Nepal IRD VAT Register (Annex 5) Screen (`/reports/vat`)
- **Purpose**: Statutory VAT reporting conforming to Nepal Inland Revenue Department Annex 5.
- **User Roles**: Owner, Admin, Accountant.
- **Components**:
  - Period Filter: Fiscal Year dropdown + Nepali Month selector (e.g. "2082 - Shrawan").
  - Tab Switcher: "Sales VAT Register", "Purchase VAT Register", "VAT Summary".
  - **Summary Cards**:
    - Total Taxable Sales & Output VAT Collected (13%).
    - Total Taxable Purchases & Claimable Input VAT.
    - Net VAT Payable / Refundable.
  - **Annex 5 Table**: Date, Invoice No, Buyer/Seller Name, Buyer/Seller PAN, Total Invoice Amount, Tax-Exempt Amount, Taxable Amount, 13% VAT Amount.
  - Actions: `Export IRD Excel`, `Print Official Register`.

### 11.2 Profit & Loss Statement Screen (`/reports/profit-loss`)
- **Purpose**: Income statement evaluating business profitability over a period.
- **Layout**:
  - Top Filter: Comparison mode (Compare with Last Period / Last Year), Date Range.
  - Financial Table:
    - **Operating Revenue**: Sales, Service Revenue, less Sales Returns.
    - **Cost of Goods Sold (COGS)**: Beginning Inventory + Purchases - Ending Inventory.
    - **Gross Profit**: (Gross Margin percentage badge).
    - **Operating Expenses**: Rent, Utilities, Salaries, Depreciation.
    - **Net Profit before Tax**: Final bottom-line result.

### 11.3 Balance Sheet Screen (`/reports/balance-sheet`)
- **Purpose**: Financial statement showing financial position as of a specific date.
- **Layout**: Dual-column or stacked format asserting:
  $$\text{Total Assets} \equiv \text{Total Liabilities} + \text{Total Equity}$$
- Includes collapsible nodes for Current Assets, Fixed Assets, Current Liabilities, Long-Term Debt, and Retained Earnings.

---

*End of Smart Billing ERP Frontend UI & UX Design Specification v1.0*
