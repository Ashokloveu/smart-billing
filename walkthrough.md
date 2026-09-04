# Smart Billing: Modernization Walkthrough

## 🌟 Step 1: Executive Dashboard & Command Center (COMPLETED & DEPLOYED)
- **Reactive Time-Period Filtering:** Real-time metrics recalculation for `Today`, `This Week`, `Baishakh (Month)`, and `Fiscal Year 2081/82`.
- **Live Low-Stock & Reorder Ticker:** Automatic inventory scan warning when stock hits reorder levels, with 1-click `+ Create Purchase Bill →`.
- **Expandable Quick Actions Launcher:** 1-click modal for Expense, Other Income, Payment In, Payment Out, Quotations, and Parties.
- **Interactive Multi-Layer Cashflow Chart:** Visual layers for All Flows, Money In, and Money Out with dynamic hover tooltips.

---

## ⚡ Step 2: Supercharged Quick POS & Hardware Counter Terminal (COMPLETED & DEPLOYED)
- **High-Fidelity Audio Synthesizer:**
  - Barcode scan beep (`880 Hz A5 tone`) on item additions.
  - Authentic ascending 4-chord cash register chime (`C5 - E5 - G5 - C6`) upon sale completion.
- **Cashier Keyboard Shortcuts:**
  - `F2`: Instant Complete Sale & Checkout.
  - `F4`: Instant focus onto barcode search input.
  - `F8`: Switch / Park current active cart across Cart 1, 2, and 3.
- **Instant Barcode Scanner & Enter Auto-Match:**
  - Pressing `Enter` or scanning with USB barcode scanners immediately detects the matching product code, adds to cart, and plays the audio beep.
- **Live Counter Discounts & Breakdown:**
  - Direct `Discount (Rs.)` input on the register with instant recalculation of Gross Subtotal, Taxable Amount, Nepal 13% VAT, and Grand Total.
- **Embedded Dynamic Fonepay QR:**
  - Auto-embeds exact total bill amount for scan-and-pay via eSewa, Khalti, and all Nepal mobile banking apps.

---

## 🧾 Step 3: Dynamic Sales & Purchase Document Studio (COMPLETED & DEPLOYED)
- **Enhanced Document Studio (`TransactionManager.tsx`):**
  - **Dynamic Route Specialization:** Automatically tunes UI and document types for `/sales`, `/sales/return`, `/purchases`, `/purchases/payment-out`, and `/purchases/return`.
  - **Live Executive KPI Strip:** Real-time metrics showing Total Volume, Total Settled, Pending Udharo / Due, and Active Entries.
  - **Fast Multi-Dimensional Filters:** Filter by Document Status (`Posted`, `Draft`, `Cancelled`), Payment Status (`Paid`, `Credit/Udharo`), and Time Periods (`Today`, `This Week`, `Baishakh`).
  - **Instant Party Khata Indicator:** Real-time customer/supplier balance badge (`Udharo / Receivable` vs `Advance / Clear`) with credit limits and PAN verification.
  - **Inline Quick Party Creation:** Seamless modal to register a new customer or vendor with mobile & PAN on the fly without leaving the invoice creation workflow.
  - **Dynamic Item Matrix Engine:**
    - Stock availability badge (`📦 Stock: 15 PCS`, turns amber/red when low or out of stock).
    - Split Discount Mode: Toggle between Flat (`Rs.`) and Percentage (`%`) discount per item with live recalculation.
    - 13% Nepal VAT toggle per row (taxable vs tax-exempt).
    - 1-Click row duplicate (`⧉`) and delete (`🗑️`).
  - **Nepal IRD Financial Calculation Breakdown:**
    - Gross Subtotal, Item Discounts, Taxable Amount, Tax-Exempt Amount, 13% VAT, Grand Total, and Amount in Words (अक्षरेपी) in English and Nepali transliteration.
  - **Counter Settlement Drawer:** Full Cash (100%), 50% Advance, or Credit (0%) quick-fill buttons with live remaining balance calculation.
  - **1-Click Actions:** 🖨️ Save & Print, ⧉ Duplicate / Clone Document, 💬 WhatsApp Share, 💵 Quick Collect Payment, ✕ Reverse.

- **Multi-Template Dynamic Invoice Preview Modal (`InvoicePreviewModal.tsx`):**
  - **Template 1: 🇳🇵 Nepal IRD Tax Invoice (अनुसूची-५ / Schedule 5 Official Format):** Complete with bilingual Nepali headings, seller PAN in 9 boxed cells, buyer PAN, subtotal, 13% VAT breakdown, amount in words, IRD legal declaration, and signature lines.
  - **Template 2: 📄 Modern Studio A4:** Elegant emerald & slate theme with structured cards and QR code.
  - **Template 3: 🧾 80mm POS Thermal Slip:** Monospaced counter slip formatted for thermal receipt printers.
  - **Injected Print Stylesheet:** Clean `@media print` CSS so printing outputs strictly the invoice sheet with zero margin waste.
  - **Instant Sharing:** 1-click WhatsApp share with pre-formatted invoice summary, and email dispatcher.

- **Customer Quotations & Estimates Studio (`QuotationListPage.tsx`):**
  - **Top CRM Pipeline KPIs:** Total Quotations, Pending Acceptance, Converted to Orders, and Estimated Pipeline Value.
  - **Interactive Estimate Creator:** Select customer, set validity period (7, 15, 30, 60 days), line items with discounts, and notes.
  - **⚡ 1-Click Convert to Tax Invoice:** Automatically turns accepted quotes into confirmed sales invoices and updates quotation status.
  - **Estimate View & WhatsApp Proposal Share:** Share quotes with customers via WhatsApp with one click.

---

## 📦 Step 4: Smart Inventory & Warehouse Engine (COMPLETED & DEPLOYED)
- **Multi-Store Stock Positions & WAC Valuation:**
  - Real-time stock counts across Balaju, New Road, and regional godowns with total asset valuation in NPR.
  - Low stock warning badges with live minimum safety stock comparison.
- **Batch & Expiry Date Radar (`InventoryDashboard.tsx`):**
  - Dedicated lot tracking for FMCG, retail groceries, and pharmaceutical lines with Batch #, MFG Date, EXP Date, and MRP.
  - Color-coded shelf-life radar: 🔴 `EXPIRED`, 🟡 `NEAR EXPIRY (<30 DAYS)`, 🟢 `FRESH`.
- **Automated Reorder Desk:**
  - Highlights deficit stock units below safety reorder threshold with 1-click `+ Create Purchase Bill →` replenishment link to `/purchases`.
- **Inter-Store Transfers with Official Gate Pass Chalan Generator:**
  - Transfer items between godowns preserving exact WAC cost valuation.
  - Generates and prints official **अन्तर-गोदाम चलानी पुर्जी (Transfer Gate Pass)** with vehicle number, driver name, and dispatch/receiver signatures.
- **Physical Count & Variance Reconciliation Audit Tool:**
  - Real-time variance comparison: Cashier inputs physical stock, system computes variance (`Physical - Recorded`), and posts GL inventory write-offs or adjustments with reason codes (Damaged, Expired, Theft, Audit Correction).
- **Barcode & Shelf Price Tag Designer (`BarcodeGeneratorModal.tsx`):**
  - Smart Billing branded adhesive price tag stickers with SVG bar-lines, SKU, MRP, QR code, and optional Batch/Expiry stamps.
  - Printable in customized copy counts (1 to 120 copies per sheet).

---

## 👥 Step 5: Parties & Digital Udharo (Credit) Khata with WhatsApp Bot (COMPLETED & DEPLOYED)
- **Digital Udharo Khata Modal (`PartyKhataModal.tsx`):**
  - Instant party ledger statement with live balance: 🔴 **NPR X (To Receive / लिनुपर्ने उधारो)** or 🟡 **NPR X (To Pay / आपूर्तिकर्तालाई तिर्नुपर्ने)**.
  - Embedded Fonepay QR Code generated specifically for the customer's balance due.
  - 💬 **1-Click WhatsApp Khata Dispatch:** Dispatches complete personalized Nepali account balance breakdown to the customer's mobile.
  - 🖨️ **Print Statement:** Official account statement with seller header, transaction history, and signature lines.
  - 💵 **Counter Settlement Drawer:** Quickly book payment receipts or supplier payments without leaving the ledger.
- **Automated WhatsApp Payment Recovery Bot (`PaymentRemindersModal.tsx`):**
  - Syncs live debtor accounts directly from database.
  - 3 Selectable Message Tones:
    - 🤝 **Friendly Reminder (विनम्र स्मरण)**
    - ⚠️ **Standard Overdue Notice (भाका नाघेको ताकेता)**
    - 🚨 **Urgent Final Notice (अन्तिम ताकेता सूचना - Fonepay QR Included)**
  - Direct 1-click WhatsApp opening for each pending account.
- **Executive Parties KPI Summary Bar (`PartiesPage.tsx`):**
  - Live totals for **Customer Udharo (Receivable)**, **Supplier Payables**, and debtor account counts.
  - Fast status tabs: `All Parties`, `Customers Only`, `Suppliers Only`, and `⚠️ Pending Udharo (>0)`.

---

## 🏦 Step 6 — Bank & Cash Management (IMPLEMENTED LOCALLY — DEPLOYMENT REQUIRED)
- Tenant-scoped bank, cash, and digital-wallet accounts backed by General Ledger asset accounts.
- Fund transfers create balanced contra journals: destination debit and source credit.
- Insufficient-fund checks and open fiscal-period requirements protect posting integrity.
- Persistent Post-Dated Cheque ledger with guarded Pending, Deposited, Cleared, Bounced, and Cancelled transitions.
- Bank reconciliation matches posted journal lines and records the responsible user and timestamp.
- Running balances are calculated from posted ledger entries rather than browser sample data.
