# SMART BILLING ERP SYSTEM
## Production MongoDB Database Design Specification
### Version 1.0 | September 2026

> **Derivation**: Synthesized from [SMART_BILLING_ERP_SRS.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_ERP_SRS.md) and [SMART_BILLING_TECHNICAL_ARCHITECTURE.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_TECHNICAL_ARCHITECTURE.md).  
> **Target Database**: MongoDB 7.0+ Replica Set (WiredTiger Storage Engine).  
> **Status**: Database Architecture & Schema Specification Only (Design document — no application code).  
> **Key Database Standards**: Mandatory Multi-Tenancy (`organizationId`), Multi-Document ACID Transactions, Arbitrary-Precision BSON `Decimal128` for all monetary arithmetic, Immutable Audit Trail, Compound Index Optimizations.

---

## Table of Contents

1. [Database Architectural Guidelines & Modeling Standards](#1-database-architectural-guidelines--modeling-standards)
2. [Core Domain Collections](#2-core-domain-collections)
   - 2.1 `organizations`
   - 2.2 `firms` (Branches)
   - 2.3 `users`
   - 2.4 `company_users`
   - 2.5 `roles`
   - 2.6 `permissions`
   - 2.7 `settings`
3. [Master Data Collections](#3-master-data-collections)
   - 3.1 `parties` (Customers & Suppliers)
   - 3.2 `party_groups`
   - 3.3 `items` (Products & Services)
   - 3.4 `categories`
   - 3.5 `units` & `unit_conversions`
   - 3.6 `warehouses` (Stores / Godowns)
   - 3.7 `tax_policies` (VAT & Tax Configurations)
4. [Transaction Collections](#4-transaction-collections)
   - 4.1 `transactions` (Sales Invoices, Purchase Bills, Credit/Debit Notes)
   - 4.2 `document_sequences` (Atomic Numbering Series)
   - 4.3 `payments` & `payment_allocations`
   - 4.4 `expenses`
   - 4.5 `stock_movements`
5. [Accounting Collections](#5-accounting-collections)
   - 5.1 `accounts` (Chart of Accounts)
   - 5.2 `journal_entries`
   - 5.3 `ledgers` (Materialized Account Projections)
   - 5.4 `fiscal_periods` (Fiscal Years)
6. [Reporting Collections (Pre-Aggregated & Materialized)](#6-reporting-collections-pre-aggregated--materialized)
   - 6.1 `report_sales_daily` (Materialized Daily Sales)
   - 6.2 `report_vat_periods` (Nepal IRD VAT Register Snapshot)
   - 6.3 `stock_balances` (Materialized Inventory Positions)
   - 6.4 `financial_statements_snapshots` (P&L & Balance Sheet Snapshots)
7. [System & Operational Collections](#7-system--operational-collections)
   - 7.1 `audit_logs`
   - 7.2 `notifications`
   - 7.3 `backups`
   - 7.4 `idempotency_keys`
   - 7.5 `outbox_events`
8. [Cross-Cutting Index Matrix & Performance Guidelines](#8-cross-cutting-index-matrix--performance-guidelines)

---

## 1. Database Architectural Guidelines & Modeling Standards

### 1.1 Multi-Tenancy & Partitioning Model
Every tenant-owned document must include an indexed `organizationId: ObjectId`. Database queries at the application tier enforce `{ organizationId: <currentTenantId> }` as a mandatory selector. System collections (e.g. global units or platform administrative definitions) use `organizationId: null`.

### 1.2 Strict Financial Precision & IEEE 754 Prohibition
Standard floating-point numbers (`Double`) are prohibited for all currency amounts, rates, taxes, and quantity balances. All financial fields use BSON **`Decimal128`** (`NumberDecimal`).

### 1.3 Immutable Documents vs. Mutable Drafts
Documents in `draft` state are mutable. Documents marked `posted` cannot be updated or deleted. Corrections are applied through reversal entries, linked credit/debit notes, or compensating journal entries.

### 1.4 Temporal Data Standards
- **Gregorian Dates**: Persisted as UTC BSON `Date` (`ISODate`).
- **Nepali Calendar (Bikram Sambat)**: Denormalized as formatted strings (e.g., `"2082-05-15"`) at the document boundary for indexing and query speed without runtime conversion overhead.

---

## 2. Core Domain Collections

### 2.1 `organizations`

#### 2.1.1 Purpose
Represents the top-level tenant entity. All companies, users, settings, and accounting books belong to an organization.

#### 2.1.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Unique Organization Identifier |
| `name` | `String` | Yes | Legal commercial organization name |
| `slug` | `String` | Yes | URL-friendly unique identifier |
| `country` | `String` | Yes | ISO 3166-1 alpha-2 code (`"NP"`) |
| `currency` | `String` | Yes | ISO 4217 Currency Code (`"NPR"`) |
| `timezone` | `String` | Yes | IANA Timezone (`"Asia/Kathmandu"`) |
| `logoUrl` | `String` | No | S3/CDN link to organization logo |
| `taxRegistration` | `Object` | Yes | Tax registration details (PAN/VAT) |
| `taxRegistration.type` | `String` | Yes | Enum: `["PAN", "VAT"]` |
| `taxRegistration.number` | `String` | Yes | 9-digit PAN/VAT identifier |
| `taxRegistration.verified` | `Boolean` | Yes | IRD verification flag |
| `subscription` | `Object` | Yes | SaaS tier information |
| `subscription.plan` | `String` | Yes | Enum: `["starter", "standard", "enterprise"]` |
| `subscription.expiresAt`| `Date` | Yes | Subscription expiration date |
| `isActive` | `Boolean` | Yes | Active status flag (default `true`) |
| `createdAt` | `Date` | Yes | Creation timestamp |
| `updatedAt` | `Date` | Yes | Last update timestamp |

#### 2.1.3 Indexes
- `{ slug: 1 }` (Unique)
- `{ "taxRegistration.number": 1 }` (Sparse)
- `{ isActive: 1, createdAt: -1 }`

#### 2.1.4 Validation Rules (JSON Schema)
```javascript
{
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "slug", "country", "currency", "timezone", "taxRegistration", "isActive"],
    properties: {
      name: { bsonType: "string", minLength: 2, maxLength: 120 },
      slug: { bsonType: "string", pattern: "^[a-z0-9-]+$" },
      country: { bsonType: "string", minLength: 2, maxLength: 2 },
      currency: { bsonType: "string", minLength: 3, maxLength: 3 },
      "taxRegistration.number": { bsonType: "string", pattern: "^[0-9]{9}$" }
    }
  }
}
```

#### 2.1.5 Relationships
- Has many `firms` (`_id` -> `firms.organizationId`).
- Has many `company_users` (`_id` -> `company_users.organizationId`).

#### 2.1.6 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001a111111" },
  "name": "Kathmandu Trading House Pvt. Ltd.",
  "slug": "ktm-trading",
  "country": "NP",
  "currency": "NPR",
  "timezone": "Asia/Kathmandu",
  "logoUrl": "https://assets.smartbilling.np/orgs/66e01a1f4b8c9d001a111111/logo.png",
  "taxRegistration": {
    "type": "VAT",
    "number": "601234567",
    "verified": true
  },
  "subscription": {
    "plan": "enterprise",
    "expiresAt": { "$date": "2027-09-01T00:00:00.000Z" }
  },
  "isActive": true,
  "createdAt": { "$date": "2026-09-01T08:00:00.000Z" },
  "updatedAt": { "$date": "2026-09-01T08:00:00.000Z" }
}
```

---

### 2.2 `firms` (Branches)

#### 2.2.1 Purpose
Models legal branches or independent physical locations operating under an organization, sharing catalog and parties but with isolated sequence numbering, addresses, and physical stock.

#### 2.2.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Unique Branch/Firm ID |
| `organizationId` | `ObjectId` | Yes | Parent Organization reference |
| `name` | `String` | Yes | Firm/Branch name |
| `code` | `String` | Yes | Branch code (e.g., `"KTM-01"`) |
| `isHeadOffice` | `Boolean` | Yes | Head branch flag |
| `address` | `Object` | Yes | Structured physical address |
| `address.line1` | `String` | Yes | Street address |
| `address.city` | `String` | Yes | Municipality / City |
| `address.district` | `String` | Yes | Nepal District (e.g., `"Kathmandu"`) |
| `address.province` | `String` | Yes | Province (e.g., `"Bagmati"`) |
| `phone` | `String` | Yes | Contact phone number |
| `email` | `String` | No | Branch email |
| `signatureUrl` | `String` | No | Authorized signatory image link |
| `isActive` | `Boolean` | Yes | Active status flag |
| `createdAt` | `Date` | Yes | Timestamp |
| `updatedAt` | `Date` | Yes | Timestamp |

#### 2.2.3 Indexes
- `{ organizationId: 1, code: 1 }` (Unique)
- `{ organizationId: 1, isHeadOffice: 1 }`

#### 2.2.4 Relationships
- Belongs to `organizations` (`organizationId` -> `organizations._id`).
- Has many `warehouses` (`_id` -> `warehouses.firmId`).

#### 2.2.5 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001a222222" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "name": "Kathmandu Main Branch",
  "code": "KTM-BR1",
  "isHeadOffice": true,
  "address": {
    "line1": "New Road, Ward 22",
    "city": "Kathmandu",
    "district": "Kathmandu",
    "province": "Bagmati"
  },
  "phone": "+977-1-4234567",
  "email": "head.office@ktmtrading.com.np",
  "isActive": true,
  "createdAt": { "$date": "2026-09-01T08:30:00.000Z" },
  "updatedAt": { "$date": "2026-09-01T08:30:00.000Z" }
}
```

---

### 2.3 `users`

#### 2.3.1 Purpose
Stores global authentication credentials, MFA configuration, and personal profile details independent of individual company memberships.

#### 2.3.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Unique User ID |
| `fullName` | `String` | Yes | Full Name |
| `email` | `String` | Yes | Unique login email |
| `phone` | `String` | Yes | Mobile number for OTP |
| `passwordHash` | `String` | Yes | Argon2id cryptographic hash |
| `mfa` | `Object` | Yes | Multi-factor authentication settings |
| `mfa.enabled` | `Boolean` | Yes | MFA activation state |
| `mfa.secret` | `String` | No | Encrypted TOTP secret |
| `isSuperAdmin` | `Boolean` | Yes | Global system operator flag |
| `isActive` | `Boolean` | Yes | Account status flag |
| `lastLoginAt` | `Date` | No | Last successful login |
| `createdAt` | `Date` | Yes | Timestamp |
| `updatedAt` | `Date` | Yes | Timestamp |

#### 2.3.3 Indexes
- `{ email: 1 }` (Unique)
- `{ phone: 1 }` (Unique)

#### 2.3.4 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001a333333" },
  "fullName": "Suman Shrestha",
  "email": "suman.shrestha@ktmtrading.com.np",
  "phone": "+977-9841234567",
  "passwordHash": "$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHQ$abcdefghijklmnopqrstuvwxyz0123456789",
  "mfa": {
    "enabled": true,
    "secret": "JBSWY3DPEHPK3PXP"
  },
  "isSuperAdmin": false,
  "isActive": true,
  "lastLoginAt": { "$date": "2026-09-03T02:00:00.000Z" },
  "createdAt": { "$date": "2026-09-01T09:00:00.000Z" },
  "updatedAt": { "$date": "2026-09-03T02:00:00.000Z" }
}
```

---

### 2.4 `company_users`

#### 2.4.1 Purpose
Junction collection implementing multi-tenancy access control, linking users to organizations with assigned roles.

#### 2.4.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Membership ID |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `userId` | `ObjectId` | Yes | User reference |
| `roleId` | `ObjectId` | Yes | Assigned Role reference |
| `assignedFirmIds` | `Array<ObjectId>`| Yes | Allowed branch locations (empty = all) |
| `status` | `String` | Yes | Enum: `["invited", "active", "suspended"]` |
| `createdAt` | `Date` | Yes | Timestamp |
| `updatedAt` | `Date` | Yes | Timestamp |

#### 2.4.3 Indexes
- `{ organizationId: 1, userId: 1 }` (Unique)
- `{ userId: 1 }`

#### 2.4.4 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001a444444" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "userId": { "$oid": "66e01a1f4b8c9d001a333333" },
  "roleId": { "$oid": "66e01a1f4b8c9d001a555555" },
  "assignedFirmIds": [{ "$oid": "66e01a1f4b8c9d001a222222" }],
  "status": "active",
  "createdAt": { "$date": "2026-09-01T09:15:00.000Z" },
  "updatedAt": { "$date": "2026-09-01T09:15:00.000Z" }
}
```

---

### 2.5 `roles` & 2.6 `permissions`

#### 2.5.1 Purpose
Defines access tiers and lists available system permissions.

#### 2.5.2 Field Definitions (`roles`)
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Role Identifier |
| `organizationId` | `ObjectId` | No | Organization reference (null for system defaults) |
| `name` | `String` | Yes | Role Name (`"owner"`, `"admin"`, `"accountant"`) |
| `isSystem` | `Boolean` | Yes | True if protected immutable role |
| `permissions` | `Array<String>` | Yes | List of permission codes |
| `createdAt` | `Date` | Yes | Timestamp |
| `updatedAt` | `Date` | Yes | Timestamp |

#### 2.5.3 Indexes
- `{ organizationId: 1, name: 1 }` (Unique)

#### 2.5.4 Sample JSON Document (`roles`)
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001a555555" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "name": "Accountant",
  "isSystem": false,
  "permissions": [
    "sale:view",
    "purchase:view",
    "journal:create",
    "journal:post",
    "report:pnl:view",
    "report:vat:view",
    "party:view"
  ],
  "createdAt": { "$date": "2026-09-01T09:00:00.000Z" },
  "updatedAt": { "$date": "2026-09-01T09:00:00.000Z" }
}
```

---

### 2.7 `settings`

#### 2.7.1 Purpose
Maintains organization-level accounting conventions, calendar defaults, rounding rules, and feature toggles.

#### 2.7.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Settings Record ID |
| `organizationId` | `ObjectId` | Yes | Organization reference (One-to-One) |
| `financial` | `Object` | Yes | Financial & Accounting Rules |
| `financial.defaultCurrency`| `String` | Yes | `"NPR"` |
| `financial.decimalPrecision`| `Int32` | Yes | Scale (default `2`) |
| `financial.roundOffMethod`| `String` | Yes | Enum: `["nearest", "up", "down", "none"]` |
| `financial.allowNegativeStock`| `Boolean`| Yes | Restricts stock overdrafts |
| `localization` | `Object` | Yes | Locale & Calendar Configurations |
| `localization.displayCalendar`| `String` | Yes | Enum: `["bikram_sambat", "gregorian", "both"]` |
| `localization.primaryLanguage`| `String` | Yes | Enum: `["en", "ne", "bilingual"]` |
| `features` | `Object` | Yes | Feature toggles (e.g. `batchTracking`, `estimates`) |
| `updatedAt` | `Date` | Yes | Timestamp |

#### 2.7.3 Indexes
- `{ organizationId: 1 }` (Unique)

#### 2.7.4 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001a666666" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "financial": {
    "defaultCurrency": "NPR",
    "decimalPrecision": 2,
    "roundOffMethod": "nearest",
    "allowNegativeStock": false
  },
  "localization": {
    "displayCalendar": "both",
    "primaryLanguage": "bilingual"
  },
  "features": {
    "batchTracking": false,
    "serialNumbers": false,
    "multiStore": true,
    "deliveryChallan": true
  },
  "updatedAt": { "$date": "2026-09-01T09:00:00.000Z" }
}
```

---

## 3. Master Data Collections

### 3.1 `parties` (Customers & Suppliers)

#### 3.1.1 Purpose
Stores individual customer and supplier profiles, tax IDs, credit limits, and addresses.

#### 3.1.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Party Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `type` | `String` | Yes | Enum: `["customer", "supplier", "both"]` |
| `name` | `String` | Yes | Legal entity or individual name |
| `panNumber` | `String` | No | 9-digit PAN / VAT identification number |
| `email` | `String` | No | Contact email |
| `phone` | `String` | Yes | Primary phone number |
| `billingAddress` | `Object` | Yes | Billing address |
| `billingAddress.city`| `String` | Yes | City |
| `billingAddress.district`| `String` | Yes | District |
| `creditLimit` | `Decimal128` | Yes | Max receivable threshold (default `0.00`) |
| `openingBalance` | `Object` | Yes | Initial ledger balance |
| `openingBalance.amount`| `Decimal128`| Yes | Positive = Receivable, Negative = Payable |
| `openingBalance.date`| `Date` | Yes | Effective date of opening balance |
| `currentBalance` | `Decimal128` | Yes | Denormalized current ledger balance |
| `groupIds` | `Array<ObjectId>`| Yes | Linked party groups |
| `isActive` | `Boolean` | Yes | Active status |
| `version` | `Int32` | Yes | Optimistic Concurrency Control integer |
| `createdAt` | `Date` | Yes | Timestamp |
| `updatedAt` | `Date` | Yes | Timestamp |

#### 3.1.3 Indexes
- `{ organizationId: 1, type: 1, name: 1 }`
- `{ organizationId: 1, phone: 1 }`
- `{ organizationId: 1, panNumber: 1 }` (Sparse)

#### 3.1.4 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001b111111" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "type": "customer",
  "name": "Himalayan Retailers Pvt. Ltd.",
  "panNumber": "301987654",
  "email": "purchase@himalayanretail.com.np",
  "phone": "+977-1-5544332",
  "billingAddress": {
    "line1": "Patan Dhoka",
    "city": "Lalitpur",
    "district": "Lalitpur",
    "province": "Bagmati"
  },
  "creditLimit": { "$numberDecimal": "500000.00" },
  "openingBalance": {
    "amount": { "$numberDecimal": "15000.00" },
    "date": { "$date": "2026-07-16T00:00:00.000Z" }
  },
  "currentBalance": { "$numberDecimal": "128000.00" },
  "groupIds": [{ "$oid": "66e01a1f4b8c9d001b222222" }],
  "isActive": true,
  "version": 4,
  "createdAt": { "$date": "2026-09-01T10:00:00.000Z" },
  "updatedAt": { "$date": "2026-09-02T16:30:00.000Z" }
}
```

---

### 3.2 `party_groups`

#### 3.2.1 Purpose
Categorizes parties for tiered pricing, credit limits, and segmented aging reports.

#### 3.2.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Group Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `name` | `String` | Yes | Group name (e.g. `"Wholesalers"`, `"Key Accounts"`) |
| `description` | `String` | No | Summary |
| `createdAt` | `Date` | Yes | Timestamp |

#### 3.2.3 Indexes
- `{ organizationId: 1, name: 1 }` (Unique)

---

### 3.3 `items` (Products & Services)

#### 3.3.1 Purpose
Maintains the catalog of inventory products and non-stock service items, including pricing, tax policies, and unit conversions.

#### 3.3.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Item Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `type` | `String` | Yes | Enum: `["product", "service"]` |
| `name` | `String` | Yes | Commercial product name |
| `code` | `String` | Yes | Stock Keeping Unit (SKU) |
| `barcode` | `String` | No | Barcode / EAN-13 string |
| `categoryId` | `ObjectId` | Yes | Reference to item category |
| `primaryUnitId` | `ObjectId` | Yes | Base Unit of Measure reference |
| `secondaryUnitId`| `ObjectId` | No | Optional secondary unit |
| `conversionFactor`| `Decimal128`| No | Secondary-to-primary factor |
| `hsnSacCode` | `String` | No | Nepal Customs HSN / SAC code |
| `taxPolicyId` | `ObjectId` | Yes | Reference to active tax policy |
| `salePrice` | `Decimal128` | Yes | Standard selling rate |
| `purchasePrice`| `Decimal128` | Yes | Standard purchasing cost rate |
| `isStockTracked`| `Boolean` | Yes | True for physical goods, false for services |
| `minimumStock` | `Decimal128` | No | Reorder threshold quantity |
| `isActive` | `Boolean` | Yes | Active status |
| `version` | `Int32` | Yes | Optimistic Concurrency Control |
| `createdAt` | `Date` | Yes | Timestamp |
| `updatedAt` | `Date` | Yes | Timestamp |

#### 3.3.3 Indexes
- `{ organizationId: 1, code: 1 }` (Unique)
- `{ organizationId: 1, barcode: 1 }` (Sparse, Unique)
- `{ organizationId: 1, categoryId: 1 }`
- `{ organizationId: 1, name: "text" }` (Full-text index)

#### 3.3.4 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001b333333" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "type": "product",
  "name": "Bhairahawa OPC Cement 50kg",
  "code": "CEM-OPC-50",
  "barcode": "8901234567890",
  "categoryId": { "$oid": "66e01a1f4b8c9d001b444444" },
  "primaryUnitId": { "$oid": "66e01a1f4b8c9d001b555555" },
  "hsnSacCode": "2523.29.00",
  "taxPolicyId": { "$oid": "66e01a1f4b8c9d001b666666" },
  "salePrice": { "$numberDecimal": "780.00" },
  "purchasePrice": { "$numberDecimal": "690.00" },
  "isStockTracked": true,
  "minimumStock": { "$numberDecimal": "100.00" },
  "isActive": true,
  "version": 1,
  "createdAt": { "$date": "2026-09-01T11:00:00.000Z" },
  "updatedAt": { "$date": "2026-09-01T11:00:00.000Z" }
}
```

---

### 3.4 `categories`

#### 3.4.1 Purpose
Hierarchical taxonomy for organizing products and services.

#### 3.4.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Category Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `name` | `String` | Yes | Category name |
| `parentCategoryId`| `ObjectId` | No | Parent category reference (null if top-level) |
| `createdAt` | `Date` | Yes | Timestamp |

#### 3.4.3 Indexes
- `{ organizationId: 1, name: 1, parentCategoryId: 1 }` (Unique)

---

### 3.5 `units` & `unit_conversions`

#### 3.5.1 Purpose
Defines Units of Measure (UOM) such as PCS, KG, BAG, and conversion ratios.

#### 3.5.2 Sample JSON Document (`units`)
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001b555555" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "name": "Bag",
  "abbreviation": "BAG",
  "isSystem": false,
  "createdAt": { "$date": "2026-09-01T10:00:00.000Z" }
}
```

---

### 3.6 `warehouses` (Stores / Godowns)

#### 3.6.1 Purpose
Models physical storage locations where inventory lots reside.

#### 3.6.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Warehouse Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `firmId` | `ObjectId` | Yes | Branch firm reference |
| `name` | `String` | Yes | Store name (e.g. `"Balaju Main Godown"`) |
| `code` | `String` | Yes | Store code (e.g. `"WH-01"`) |
| `isDefault` | `Boolean` | Yes | Default storage location flag |
| `isActive` | `Boolean` | Yes | Active status |

#### 3.6.3 Indexes
- `{ organizationId: 1, code: 1 }` (Unique)

---

### 3.7 `tax_policies` (VAT & Tax Configurations)

#### 3.7.1 Purpose
Maintains tax configurations, supporting standard 13% Nepal VAT, zero-rated exports, exemptions, and versioned tax rules.

#### 3.7.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Tax Policy Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `name` | `String` | Yes | Policy name (e.g., `"Nepal VAT 13%"`) |
| `jurisdiction` | `String` | Yes | Jurisdiction code (`"NP"`) |
| `taxType` | `String` | Yes | Enum: `["VAT", "EXCISE", "NON_TAXABLE"]` |
| `rate` | `Decimal128` | Yes | Percentage rate (e.g. `13.00`) |
| `isInclusive` | `Boolean` | Yes | True if prices include tax |
| `accountId` | `ObjectId` | Yes | Linked chart of accounts tax liability ID |
| `version` | `Int32` | Yes | Incremental policy version integer |
| `isActive` | `Boolean` | Yes | Active status |

#### 3.7.3 Indexes
- `{ organizationId: 1, name: 1, version: -1 }`

#### 3.7.4 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001b666666" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "name": "Nepal VAT 13%",
  "jurisdiction": "NP",
  "taxType": "VAT",
  "rate": { "$numberDecimal": "13.00" },
  "isInclusive": false,
  "accountId": { "$oid": "66e01a1f4b8c9d001d222222" },
  "version": 1,
  "isActive": true
}
```

---

## 4. Transaction Collections

### 4.1 `transactions` (Sales Invoices, Purchase Bills, Credit/Debit Notes)

#### 4.1.1 Purpose
Unified collection storing all financial business documents. Maintains complete line items, tax breakdowns, calculation snapshots, and document linkages.

#### 4.1.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Transaction Document Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `firmId` | `ObjectId` | Yes | Issuing Branch Firm reference |
| `financialYearId` | `ObjectId` | Yes | Associated Fiscal Year reference |
| `type` | `String` | Yes | Enum: `["sale_invoice", "purchase_bill", "credit_note", "debit_note"]` |
| `status` | `String` | Yes | Enum: `["draft", "posted", "partially_paid", "paid", "reversed", "voided"]` |
| `documentNumber` | `String` | Yes | Generated identifier (e.g. `"INV-2082/83-0001"`) |
| `date` | `Date` | Yes | UTC transaction accounting date |
| `bsDate` | `String` | Yes | Bikram Sambat date string (e.g. `"2082-05-15"`) |
| `dueDate` | `Date` | No | Payment maturity due date |
| `partyId` | `ObjectId` | No | Counterparty reference (optional for cash sales) |
| `partyName` | `String` | Yes | Historical snapshot of party name |
| `partyPan` | `String` | No | Historical snapshot of party PAN |
| `lines` | `Array<Object>` | Yes | Itemized document lines |
| `lines[].itemId` | `ObjectId` | Yes | Item reference |
| `lines[].itemName` | `String` | Yes | Historical snapshot of item name |
| `lines[].quantity` | `Decimal128` | Yes | Billed quantity |
| `lines[].rate` | `Decimal128` | Yes | Base rate per unit |
| `lines[].grossAmount` | `Decimal128` | Yes | `quantity * rate` |
| `lines[].discountAmount`| `Decimal128`| Yes | Line discount deduction |
| `lines[].taxableAmount`| `Decimal128` | Yes | Base amount for tax calculation |
| `lines[].taxRate` | `Decimal128` | Yes | Applied tax percentage (`13.00`) |
| `lines[].taxAmount` | `Decimal128` | Yes | Line calculated tax |
| `lines[].lineTotal` | `Decimal128` | Yes | Final line total |
| `subtotal` | `Decimal128` | Yes | Sum of line gross amounts minus discounts |
| `totalTaxableAmount`| `Decimal128` | Yes | Total tax base across all taxable lines |
| `totalTax` | `Decimal128` | Yes | Total VAT/Tax calculated |
| `roundOff` | `Decimal128` | Yes | Fractional rounding adjustment |
| `grandTotal` | `Decimal128` | Yes | Authoritative total payable amount |
| `paidAmount` | `Decimal128` | Yes | Total allocated payment to date |
| `balanceDue` | `Decimal128` | Yes | Unsettled remaining amount |
| `idempotencyKey` | `String` | No | Unique client mutation token |
| `reversalReason` | `String` | No | Explanation if status is `"reversed"` |
| `reversedAt` | `Date` | No | Reversal timestamp |
| `version` | `Int32` | Yes | Concurrency control version integer |
| `createdBy` | `ObjectId` | Yes | User who created the record |
| `createdAt` | `Date` | Yes | Timestamp |
| `updatedAt` | `Date` | Yes | Timestamp |

#### 4.1.3 Indexes
- `{ organizationId: 1, type: 1, status: 1, date: -1 }`
- `{ organizationId: 1, documentNumber: 1 }` (Unique)
- `{ organizationId: 1, partyId: 1, date: -1 }`
- `{ idempotencyKey: 1 }` (Unique, Sparse)

#### 4.1.4 Sample JSON Document (Posted Sale Invoice)
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001c111111" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "firmId": { "$oid": "66e01a1f4b8c9d001a222222" },
  "financialYearId": { "$oid": "66e01a1f4b8c9d001d111111" },
  "type": "sale_invoice",
  "status": "partially_paid",
  "documentNumber": "INV-2082/83-0012",
  "date": { "$date": "2026-09-02T10:00:00.000Z" },
  "bsDate": "2082-05-17",
  "dueDate": { "$date": "2026-10-02T10:00:00.000Z" },
  "partyId": { "$oid": "66e01a1f4b8c9d001b111111" },
  "partyName": "Himalayan Retailers Pvt. Ltd.",
  "partyPan": "301987654",
  "lines": [
    {
      "itemId": { "$oid": "66e01a1f4b8c9d001b333333" },
      "itemName": "Bhairahawa OPC Cement 50kg",
      "quantity": { "$numberDecimal": "100.00" },
      "rate": { "$numberDecimal": "780.00" },
      "grossAmount": { "$numberDecimal": "78000.00" },
      "discountAmount": { "$numberDecimal": "3000.00" },
      "taxableAmount": { "$numberDecimal": "75000.00" },
      "taxRate": { "$numberDecimal": "13.00" },
      "taxAmount": { "$numberDecimal": "9750.00" },
      "lineTotal": { "$numberDecimal": "84750.00" }
    }
  ],
  "subtotal": { "$numberDecimal": "75000.00" },
  "totalTaxableAmount": { "$numberDecimal": "75000.00" },
  "totalTax": { "$numberDecimal": "9750.00" },
  "roundOff": { "$numberDecimal": "0.00" },
  "grandTotal": { "$numberDecimal": "84750.00" },
  "paidAmount": { "$numberDecimal": "30000.00" },
  "balanceDue": { "$numberDecimal": "54750.00" },
  "idempotencyKey": "9d4f0c94-b223-42e7-9d7b-932f91df2c5e",
  "version": 2,
  "createdBy": { "$oid": "66e01a1f4b8c9d001a333333" },
  "createdAt": { "$date": "2026-09-02T10:00:00.000Z" },
  "updatedAt": { "$date": "2026-09-02T10:15:00.000Z" }
}
```

---

### 4.2 `document_sequences` (Atomic Numbering Series)

#### 4.2.1 Purpose
Guarantees sequential document numbering per `{organizationId, firmId, financialYearId, type}` without sequence gaps.

#### 4.2.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Sequence ID |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `firmId` | `ObjectId` | Yes | Branch Firm reference |
| `financialYearId` | `ObjectId` | Yes | Associated Fiscal Year reference |
| `type` | `String` | Yes | Transaction document type |
| `prefix` | `String` | Yes | Sequence prefix (e.g. `"INV-2082/83-"`) |
| `nextNumber` | `Int64` | Yes | Atomic counter (incremented via `$inc`) |

#### 4.2.3 Indexes
- `{ organizationId: 1, firmId: 1, financialYearId: 1, type: 1 }` (Unique)

---

### 4.3 `payments` & `payment_allocations`

#### 4.3.1 Purpose
Records inbound receipts from customers and outbound remittances to suppliers, linking cash/bank accounts to invoices.

#### 4.3.2 Sample JSON Document (`payments`)
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001c222222" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "paymentNumber": "RCP-2082/83-0005",
  "type": "payment_in",
  "date": { "$date": "2026-09-02T10:15:00.000Z" },
  "partyId": { "$oid": "66e01a1f4b8c9d001b111111" },
  "accountId": { "$oid": "66e01a1f4b8c9d001d333333" },
  "amount": { "$numberDecimal": "30000.00" },
  "mode": "bank_transfer",
  "reference": "NICA-TXN-98765432",
  "allocations": [
    {
      "transactionId": { "$oid": "66e01a1f4b8c9d001c111111" },
      "amount": { "$numberDecimal": "30000.00" }
    }
  ],
  "createdAt": { "$date": "2026-09-02T10:15:00.000Z" }
}
```

---

### 4.4 `expenses`

#### 4.4.1 Purpose
Tracks operational overhead (e.g. rent, electricity, logistics) not associated with supplier item purchases.

#### 4.4.2 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001c333333" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "voucherNumber": "EXP-2082/83-0045",
  "date": { "$date": "2026-09-02T14:00:00.000Z" },
  "expenseAccountId": { "$oid": "66e01a1f4b8c9d001d444444" },
  "paidFromAccountId": { "$oid": "66e01a1f4b8c9d001d333333" },
  "amount": { "$numberDecimal": "12500.00" },
  "notes": "Office electricity bill for Shrawan 2082",
  "createdAt": { "$date": "2026-09-02T14:00:00.000Z" }
}
```

---

### 4.5 `stock_movements`

#### 4.5.1 Purpose
Append-only inventory subledger. Every physical stock increment or decrement writes a movement record.

#### 4.5.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Stock Movement Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `warehouseId` | `ObjectId` | Yes | Location warehouse reference |
| `itemId` | `ObjectId` | Yes | Inventory item reference |
| `transactionId` | `ObjectId` | Yes | Source business document reference |
| `type` | `String` | Yes | Enum: `["sale", "purchase", "sale_return", "purchase_return", "adjustment", "transfer"]` |
| `quantity` | `Decimal128` | Yes | Absolute quantity moved |
| `direction` | `String` | Yes | Enum: `["IN", "OUT"]` |
| `costRate` | `Decimal128` | Yes | Cost valuation per unit at movement time |
| `totalCost` | `Decimal128` | Yes | Total cost assignment (`quantity * costRate`) |
| `date` | `Date` | Yes | Physical movement timestamp |

#### 4.5.3 Indexes
- `{ organizationId: 1, itemId: 1, warehouseId: 1, date: -1 }`
- `{ organizationId: 1, transactionId: 1 }`

---

## 5. Accounting Collections

### 5.1 `accounts` (Chart of Accounts)

#### 5.1.1 Purpose
Represents the general ledger accounts structured under standard classification codes.

#### 5.1.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Account Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `code` | `String` | Yes | Classification code (e.g. `"1110"`, `"2120"`, `"4100"`) |
| `name` | `String` | Yes | Account title |
| `type` | `String` | Yes | Enum: `["asset", "liability", "equity", "revenue", "expense"]` |
| `subType` | `String` | Yes | e.g. `"current_asset"`, `"cost_of_goods"` |
| `isSystem` | `Boolean` | Yes | System accounts cannot be deleted |
| `openingBalance` | `Decimal128` | Yes | Initial balance at fiscal year start |

#### 5.1.3 Indexes
- `{ organizationId: 1, code: 1 }` (Unique)

#### 5.1.4 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001d222222" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "code": "2120",
  "name": "VAT Payable (Output VAT)",
  "type": "liability",
  "subType": "current_liability",
  "isSystem": true,
  "openingBalance": { "$numberDecimal": "0.00" }
}
```

---

### 5.2 `journal_entries`

#### 5.2.1 Purpose
Double-entry general journal. Every posted financial transaction creates an immutable balanced journal entry.

#### 5.2.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Journal Entry Identifier |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `transactionId` | `ObjectId` | Yes | Source transaction document ID |
| `entryNumber` | `String` | Yes | Sequential Journal Voucher ID (e.g. `"JV-0043"`) |
| `date` | `Date` | Yes | Effective accounting date |
| `narration` | `String` | Yes | Transaction description |
| `lines` | `Array<Object>` | Yes | Debit and Credit lines |
| `lines[].accountId`| `ObjectId` | Yes | Chart of accounts reference |
| `lines[].debit` | `Decimal128` | Yes | Debit amount (must be `0.00` if credit > 0) |
| `lines[].credit` | `Decimal128` | Yes | Credit amount (must be `0.00` if debit > 0) |
| `totalDebit` | `Decimal128` | Yes | Sum of debits (must equal `totalCredit`) |
| `totalCredit` | `Decimal128` | Yes | Sum of credits (must equal `totalDebit`) |
| `isReversed` | `Boolean` | Yes | True if offset by a reversing journal |
| `createdAt` | `Date` | Yes | Creation timestamp |

#### 5.2.3 Indexes
- `{ organizationId: 1, date: -1 }`
- `{ organizationId: 1, transactionId: 1 }`
- `{ organizationId: 1, "lines.accountId": 1, date: -1 }`

#### 5.2.4 Sample JSON Document (Balanced Sale Invoice Entry)
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001d555555" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "transactionId": { "$oid": "66e01a1f4b8c9d001c111111" },
  "entryNumber": "JV-2082/83-0102",
  "date": { "$date": "2026-09-02T10:00:00.000Z" },
  "narration": "Sales Invoice INV-2082/83-0012 to Himalayan Retailers Pvt. Ltd.",
  "lines": [
    {
      "accountId": { "$oid": "66e01a1f4b8c9d001d666666" },
      "debit": { "$numberDecimal": "84750.00" },
      "credit": { "$numberDecimal": "0.00" }
    },
    {
      "accountId": { "$oid": "66e01a1f4b8c9d001d777777" },
      "debit": { "$numberDecimal": "0.00" },
      "credit": { "$numberDecimal": "75000.00" }
    },
    {
      "accountId": { "$oid": "66e01a1f4b8c9d001d222222" },
      "debit": { "$numberDecimal": "0.00" },
      "credit": { "$numberDecimal": "9750.00" }
    }
  ],
  "totalDebit": { "$numberDecimal": "84750.00" },
  "totalCredit": { "$numberDecimal": "84750.00" },
  "isReversed": false,
  "createdAt": { "$date": "2026-09-02T10:00:00.000Z" }
}
```

---

### 5.3 `ledgers` (Materialized Account Projections)

#### 5.3.1 Purpose
Stores cached running balances per account for high-throughput queries without re-aggregating journal entries.

#### 5.3.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Ledger record ID |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `accountId` | `ObjectId` | Yes | Account reference |
| `balance` | `Decimal128` | Yes | Running balance |
| `lastUpdated` | `Date` | Yes | Timestamp of last posted journal |

#### 5.3.3 Indexes
- `{ organizationId: 1, accountId: 1 }` (Unique)

---

### 5.4 `fiscal_periods` (Fiscal Years)

#### 5.4.1 Purpose
Defines legal financial years in Nepal (e.g., 2082/83 BS) with lock flags preventing post-closure writes.

#### 5.4.2 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001d111111" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "label": "2082/83 BS",
  "startDate": { "$date": "2025-07-16T00:00:00.000Z" },
  "endDate": { "$date": "2026-07-15T23:59:59.999Z" },
  "bsStartDate": "2082-04-01",
  "bsEndDate": "2083-03-31",
  "isClosed": false
}
```

---

## 6. Reporting Collections (Pre-Aggregated & Materialized)

### 6.1 `report_sales_daily` (Materialized Daily Sales)

#### 6.1.1 Purpose
Pre-aggregated daily sales summaries by branch firm to deliver sub-millisecond dashboard metrics.

#### 6.1.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Projection record ID |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `firmId` | `ObjectId` | Yes | Branch firm reference |
| `dateString` | `String` | Yes | Target date string (`"YYYY-MM-DD"`) |
| `totalInvoices` | `Int32` | Yes | Total count of sales invoices |
| `taxableAmount` | `Decimal128` | Yes | Aggregate taxable sales base |
| `vatAmount` | `Decimal128` | Yes | Aggregate 13% output VAT collected |
| `grossTotal` | `Decimal128` | Yes | Aggregate grand total invoiced |

#### 6.1.3 Indexes
- `{ organizationId: 1, firmId: 1, dateString: 1 }` (Unique)

---

### 6.2 `report_vat_periods` (Nepal IRD VAT Register Snapshot)

#### 6.2.1 Purpose
Period-end snapshot for statutory filing with the Inland Revenue Department (IRD).

#### 6.2.2 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001e111111" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "taxPeriod": "2082-05",
  "sales": {
    "taxableSales": { "$numberDecimal": "12500000.00" },
    "taxExemptSales": { "$numberDecimal": "450000.00" },
    "outputVat": { "$numberDecimal": "1625000.00" }
  },
  "purchases": {
    "taxablePurchases": { "$numberDecimal": "8500000.00" },
    "inputVatClaimable": { "$numberDecimal": "1105000.00" }
  },
  "netVatPayable": { "$numberDecimal": "520000.00" },
  "isLocked": true,
  "lockedAt": { "$date": "2026-10-01T00:00:00.000Z" }
}
```

---

### 6.3 `stock_balances` (Materialized Inventory Positions)

#### 6.3.1 Purpose
Provides real-time inventory balances without running aggregate reductions over millions of historic stock movements.

#### 6.3.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Record ID |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `warehouseId` | `ObjectId` | Yes | Location warehouse reference |
| `itemId` | `ObjectId` | Yes | Item reference |
| `currentQuantity`| `Decimal128` | Yes | Current on-hand quantity |
| `currentValue` | `Decimal128` | Yes | Total inventory value (Weighted Average Cost) |
| `averageUnitCost`| `Decimal128` | Yes | Current weighted cost per unit |
| `updatedAt` | `Date` | Yes | Timestamp of last recalculation |

#### 6.3.3 Indexes
- `{ organizationId: 1, warehouseId: 1, itemId: 1 }` (Unique)

---

### 6.4 `financial_statements_snapshots`

#### 6.4.1 Purpose
Stores frozen balance sheets and profit & loss statements generated at the close of fiscal months or years.

---

## 7. System & Operational Collections

### 7.1 `audit_logs`

#### 7.1.1 Purpose
Append-only log of every state change, permission alteration, and financial posting. Application DB users have read and insert permissions only; update and delete privileges are revoked.

#### 7.1.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Log record ID |
| `organizationId` | `ObjectId` | Yes | Organization reference |
| `userId` | `ObjectId` | Yes | Actor reference |
| `action` | `String` | Yes | Action code (e.g. `"transaction.posted"`, `"party.updated"`) |
| `resourceType` | `String` | Yes | Target collection name |
| `resourceId` | `ObjectId` | Yes | Target document ID |
| `diff` | `Object` | Yes | Change representation |
| `diff.before` | `Object` | No | State prior to modification |
| `diff.after` | `Object` | No | State following modification |
| `ipAddress` | `String` | Yes | Client IP address |
| `correlationId`| `String` | Yes | Distributed trace ID |
| `timestamp` | `Date` | Yes | UTC timestamp |

#### 7.1.3 Indexes
- `{ organizationId: 1, timestamp: -1 }`
- `{ organizationId: 1, resourceType: 1, resourceId: 1 }`

---

### 7.2 `notifications`

#### 7.2.1 Purpose
In-app and system delivery alerts (e.g. low-stock warnings, overdue payment reminders).

#### 7.2.2 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001f111111" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "userId": { "$oid": "66e01a1f4b8c9d001a333333" },
  "type": "low_stock_warning",
  "title": "Low Stock: Bhairahawa OPC Cement",
  "message": "Stock in Balaju Main Godown has dropped to 85 Bags (Minimum: 100).",
  "isRead": false,
  "createdAt": { "$date": "2026-09-02T16:00:00.000Z" }
}
```

---

### 7.3 `backups`

#### 7.3.1 Purpose
Catalog of automated database snapshots and exported archive files.

#### 7.3.2 Field Definitions & Data Types
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Backup record ID |
| `organizationId` | `ObjectId` | No | Null for system-wide DB backups; present for tenant exports |
| `backupType` | `String` | Yes | Enum: `["system_full", "system_incremental", "tenant_export"]` |
| `storageUrl` | `String` | Yes | S3/Object Storage path |
| `fileSizeBytes` | `Int64` | Yes | Archive file size |
| `checksum` | `String` | Yes | SHA-256 integrity hash |
| `status` | `String` | Yes | Enum: `["in_progress", "completed", "failed"]` |
| `createdAt` | `Date` | Yes | Timestamp |

---

### 7.4 `idempotency_keys`

#### 7.4.1 Purpose
Deduplicates concurrent or repeated client requests, caching HTTP response status and payloads for a 48-hour window.

#### 7.4.2 Field Definitions & Indexes
- Index: `{ expiresAt: 1 }` with `expireAfterSeconds: 0` (MongoDB TTL Index).
- Index: `{ key: 1 }` (Unique).

---

### 7.5 `outbox_events`

#### 7.5.1 Purpose
Transactional Outbox Pattern. Events written within MongoDB ACID transactions for asynchronous background processing (e.g. PDF rendering, webhooks, SMS delivery).

#### 7.5.2 Sample JSON Document
```json
{
  "_id": { "$oid": "66e01a1f4b8c9d001f222222" },
  "organizationId": { "$oid": "66e01a1f4b8c9d001a111111" },
  "eventType": "invoice.posted",
  "payload": {
    "transactionId": "66e01a1f4b8c9d001c111111",
    "documentNumber": "INV-2082/83-0012",
    "grandTotal": "84750.00"
  },
  "status": "pending",
  "retryCount": 0,
  "createdAt": { "$date": "2026-09-02T10:00:00.000Z" }
}
```

---

## 8. Cross-Cutting Index Matrix & Performance Guidelines

| Collection | Target Query Patterns | Recommended Index Key | Index Type |
|---|---|---|---|
| `transactions` | List by branch, type, status, date | `{ organizationId: 1, firmId: 1, type: 1, status: 1, date: -1 }` | Compound |
| `transactions` | Document lookup & uniqueness | `{ organizationId: 1, documentNumber: 1 }` | Unique |
| `transactions` | Party statement lookups | `{ organizationId: 1, partyId: 1, date: -1 }` | Compound |
| `journal_entries`| Account ledger queries | `{ organizationId: 1, "lines.accountId": 1, date: -1 }` | Compound Multikey |
| `stock_movements`| Item card movement report | `{ organizationId: 1, itemId: 1, warehouseId: 1, date: -1 }` | Compound |
| `stock_balances` | Instant stock check | `{ organizationId: 1, warehouseId: 1, itemId: 1 }` | Unique Compound |
| `parties` | Search by phone / PAN | `{ organizationId: 1, phone: 1 }`, `{ organizationId: 1, panNumber: 1 }` | Sparse Compound |
| `items` | SKU uniqueness & barcode | `{ organizationId: 1, code: 1 }`, `{ organizationId: 1, barcode: 1 }` | Unique Compound |
| `audit_logs` | Audit trail queries | `{ organizationId: 1, timestamp: -1 }` | Compound |
| `idempotency_keys`| Automated cleanup | `{ expiresAt: 1 }` | TTL Index |

---

*End of Smart Billing ERP Production MongoDB Database Design Specification v1.0*
