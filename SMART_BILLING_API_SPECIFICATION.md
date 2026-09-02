# SMART BILLING ERP SYSTEM
## Production REST API Specification
### Version 1.0 | September 2026

> **Derivation**: Synthesized from [SMART_BILLING_ERP_SRS.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_ERP_SRS.md), [SMART_BILLING_TECHNICAL_ARCHITECTURE.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_TECHNICAL_ARCHITECTURE.md), and [SMART_BILLING_DATABASE_DESIGN.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_DATABASE_DESIGN.md).  
> **Status**: Production REST API Blueprint (Design & Interface Contracts — No Application Code).  
> **Standards**: Base URL `/api/v1`, Bearer JWT Authentication, Mandatory Multi-Tenant URI Prefixing (`/api/v1/organizations/:orgId`), `Idempotency-Key` headers on mutations, RFC 7807 problem details, and deterministic pagination contracts.

---

## Table of Contents

1. [Global API Standards & Protocol Conventions](#1-global-api-standards--protocol-conventions)
2. [Module 1: Authentication & Identity](#2-module-1-authentication--identity)
3. [Module 2: Organization & Tenant Management](#3-module-2-organization--tenant-management)
4. [Module 3: User & Role-Based Access Control (RBAC)](#4-module-3-user--role-based-access-control-rbac)
5. [Module 4: Master Data (Parties, Items, Units, Taxes, Warehouses)](#5-module-4-master-data)
6. [Module 5: Sales Transactions (Invoices, Receipts, Returns)](#6-module-5-sales-transactions)
7. [Module 6: Purchase Transactions (Bills, Payments, Returns)](#7-module-6-purchase-transactions)
8. [Module 7: Inventory Management (Adjustments, Transfers, Ledgers)](#8-module-7-inventory-management)
9. [Module 8: Financial Accounting (Accounts, Journals, Books)](#9-module-8-financial-accounting)
10. [Module 9: Reports & Analytics](#10-module-9-reports--analytics)
11. [Module 10: System Operations (Audit, Notifications, Backups)](#11-module-10-system-operations)

---

## 1. Global API Standards & Protocol Conventions

### 1.1 Uniform Envelopes

#### 1.1.1 Standard Success Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": {}
}
```

#### 1.1.2 Standard Paginated Success Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalRecords": 1420,
    "totalPages": 57,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### 1.1.3 Standard Error Envelope (RFC 7807 Compliant)
```json
{
  "success": false,
  "statusCode": 422,
  "errorCode": "VALIDATION_FAILED",
  "message": "The payload failed schema validation.",
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "errors": [
    {
      "field": "lines[0].rate",
      "message": "Rate must be a positive decimal number."
    }
  ]
}
```

### 1.2 Mandatory Request Headers
| Header | Required On | Description |
|---|---|---|
| `Authorization` | All protected routes | `Bearer <JWT_ACCESS_TOKEN>` |
| `X-Correlation-ID` | All routes | RFC 4122 UUID tracing identifier |
| `Idempotency-Key` | Financial state mutations (`POST /transactions`, `POST /payments`) | Prevents duplicate bookings on network retries |

---

## 2. Module 1: Authentication & Identity

### 2.1 Login
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/login`
- **Purpose**: Authenticates user via phone or email and password; returns JWT tokens or MFA challenge.
- **Authentication**: None (Public)
- **Required Permission**: None
- **Request Body**:
```json
{
  "identifier": "suman.shrestha@ktmtrading.com.np",
  "password": "CorrectHorseBatteryStaple99!"
}
```
- **Response JSON (HTTP 200)**:
```json
{
  "success": true,
  "statusCode": 200,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": {
    "mfaRequired": false,
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "7d9e4a3b-28f1-4b71-a021-99c0e4bfd821",
    "expiresIn": 900,
    "user": {
      "id": "66e01a1f4b8c9d001a333333",
      "fullName": "Suman Shrestha",
      "email": "suman.shrestha@ktmtrading.com.np",
      "phone": "+977-9841234567"
    }
  }
}
```
- **Validation**:
  - `identifier`: Required string, valid email or phone format (+977-98XXXXXXXX).
  - `password`: Required string, min 8 characters.
- **Errors**:
  - `401 AUTH_INVALID_CREDENTIALS`: Identifier and password mismatch.
  - `429 RATE_LIMIT_EXCEEDED`: More than 5 failed attempts per IP/account within 10 minutes.

---

### 2.2 Verify MFA
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/mfa/verify`
- **Purpose**: Completes 2FA handshake when `mfaRequired: true`.
- **Authentication**: Temporary Session Token
- **Required Permission**: None
- **Request Body**:
```json
{
  "mfaToken": "temp-mfa-session-token-string",
  "totpCode": "549210"
}
```
- **Response JSON (HTTP 200)**: Emits standard accessToken + refreshToken pair.
- **Errors**:
  - `401 AUTH_INVALID_MFA_CODE`: Invalid or expired TOTP code.

---

### 2.3 Refresh Token
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/refresh`
- **Purpose**: Exchanges a valid refresh token for a fresh token pair.
- **Authentication**: None
- **Request Body**:
```json
{
  "refreshToken": "7d9e4a3b-28f1-4b71-a021-99c0e4bfd821"
}
```
- **Response JSON (HTTP 200)**: Returns new `accessToken` and rotated `refreshToken`.
- **Errors**:
  - `401 AUTH_TOKEN_REVOKED`: Reused or expired refresh token.

---

### 2.4 Logout
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/logout`
- **Purpose**: Revokes the refresh token and terminates the active session.
- **Authentication**: Bearer Token
- **Request Body**:
```json
{
  "refreshToken": "7d9e4a3b-28f1-4b71-a021-99c0e4bfd821"
}
```
- **Response JSON (HTTP 200)**:
```json
{
  "success": true,
  "statusCode": 200,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": { "message": "Session terminated successfully." }
}
```

---

## 3. Module 2: Organization & Tenant Management

### 3.1 Get Organization Profile
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId`
- **Purpose**: Fetches legal profile, VAT/PAN registration, and configuration for an organization.
- **Authentication**: Bearer Token
- **Required Permission**: `organization:view`
- **Response JSON (HTTP 200)**:
```json
{
  "success": true,
  "statusCode": 200,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": {
    "id": "66e01a1f4b8c9d001a111111",
    "name": "Kathmandu Trading House Pvt. Ltd.",
    "slug": "ktm-trading",
    "currency": "NPR",
    "timezone": "Asia/Kathmandu",
    "taxRegistration": {
      "type": "VAT",
      "number": "601234567",
      "verified": true
    },
    "subscription": {
      "plan": "enterprise",
      "expiresAt": "2027-09-01T00:00:00.000Z"
    }
  }
}
```
- **Errors**:
  - `403 AUTH_TENANT_ACCESS_DENIED`: User is not a member of `:orgId`.

---

### 3.2 List Branches / Firms
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId/firms`
- **Purpose**: Lists all physical branches/firms under the organization.
- **Authentication**: Bearer Token
- **Required Permission**: `firm:view`
- **Response JSON (HTTP 200)**:
```json
{
  "success": true,
  "statusCode": 200,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": [
    {
      "id": "66e01a1f4b8c9d001a222222",
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
      "isActive": true
    }
  ]
}
```

---

### 3.3 Create Fiscal Year
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/fiscal-years`
- **Purpose**: Registers a new legal Nepali accounting period.
- **Authentication**: Bearer Token
- **Required Permission**: `settings:update`
- **Request Body**:
```json
{
  "label": "2083/84 BS",
  "startDate": "2026-07-16T00:00:00.000Z",
  "endDate": "2027-07-15T23:59:59.999Z",
  "bsStartDate": "2083-04-01",
  "bsEndDate": "2084-03-31"
}
```
- **Response JSON (HTTP 201)**: Returns the newly created fiscal year record.
- **Validation**:
  - `label`: Non-empty string.
  - `startDate` < `endDate`.
  - Date ranges must not overlap with existing fiscal periods.

---

## 4. Module 3: User & Role-Based Access Control (RBAC)

### 4.1 List Organization Users
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId/users`
- **Purpose**: Retrieves all assigned users, roles, and branch memberships.
- **Authentication**: Bearer Token
- **Required Permission**: `users:view`
- **Query Parameters**:
  - `page` (integer, default 1)
  - `limit` (integer, default 25)
  - `search` (string, optional user name or email)
- **Response JSON (HTTP 200)**: Paginated user list with assigned roles.

---

### 4.2 Invite User to Organization
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/users/invite`
- **Purpose**: Sends invitation email/SMS linking an account to the company.
- **Authentication**: Bearer Token
- **Required Permission**: `users:manage`
- **Request Body**:
```json
{
  "email": "accountant.ramesh@gmail.com",
  "roleId": "66e01a1f4b8c9d001a555555",
  "assignedFirmIds": ["66e01a1f4b8c9d001a222222"]
}
```
- **Response JSON (HTTP 201)**: Returns invited membership record.

---

## 5. Module 4: Master Data

### 5.1 Parties (Customers & Suppliers)

#### 5.1.1 List Parties
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId/parties`
- **Authentication**: Bearer Token
- **Required Permission**: `party:view`
- **Query Parameters**:
  - `page` (default 1), `limit` (default 25)
  - `type` (optional: `customer`, `supplier`, `both`)
  - `search` (name, phone, PAN)
  - `hasOutstanding` (boolean, optional)
- **Response JSON (HTTP 200)**:
```json
{
  "success": true,
  "statusCode": 200,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": [
    {
      "id": "66e01a1f4b8c9d001b111111",
      "name": "Himalayan Retailers Pvt. Ltd.",
      "type": "customer",
      "panNumber": "301987654",
      "phone": "+977-1-5544332",
      "creditLimit": "500000.00",
      "currentBalance": "128000.00",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalRecords": 84,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### 5.1.2 Create Party
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/parties`
- **Authentication**: Bearer Token
- **Required Permission**: `party:create`
- **Request Body**:
```json
{
  "type": "customer",
  "name": "Himalayan Retailers Pvt. Ltd.",
  "panNumber": "301987654",
  "phone": "+977-1-5544332",
  "email": "purchase@himalayanretail.com.np",
  "billingAddress": {
    "line1": "Patan Dhoka",
    "city": "Lalitpur",
    "district": "Lalitpur",
    "province": "Bagmati"
  },
  "creditLimit": "500000.00",
  "openingBalance": {
    "amount": "15000.00",
    "date": "2026-07-16T00:00:00.000Z"
  }
}
```
- **Validation**:
  - `name`: Required, 2-150 chars.
  - `panNumber`: 9 numeric digits if supplied.
  - `creditLimit`: Non-negative decimal string.

---

### 5.2 Items & Services Catalog

#### 5.2.1 Create Item
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/items`
- **Authentication**: Bearer Token
- **Required Permission**: `item:create`
- **Request Body**:
```json
{
  "type": "product",
  "name": "Bhairahawa OPC Cement 50kg",
  "code": "CEM-OPC-50",
  "barcode": "8901234567890",
  "categoryId": "66e01a1f4b8c9d001b444444",
  "primaryUnitId": "66e01a1f4b8c9d001b555555",
  "hsnSacCode": "2523.29.00",
  "taxPolicyId": "66e01a1f4b8c9d001b666666",
  "salePrice": "780.00",
  "purchasePrice": "690.00",
  "isStockTracked": true,
  "minimumStock": "100.00"
}
```
- **Response JSON (HTTP 201)**: Returns created Item entity with assigned `id`.

---

## 6. Module 5: Sales Transactions

### 6.1 Create Sales Invoice (Draft or Posted)
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/transactions/sales`
- **Purpose**: Creates and optionally posts a sale invoice atomically updating accounts and stock.
- **Authentication**: Bearer Token
- **Required Permission**: `sale:create` (or `sale:post` if `postImmediately: true`)
- **Headers**:
  - `Idempotency-Key: <UUID>` (Mandatory)
- **Request Body**:
```json
{
  "firmId": "66e01a1f4b8c9d001a222222",
  "partyId": "66e01a1f4b8c9d001b111111",
  "date": "2026-09-02T10:00:00.000Z",
  "bsDate": "2082-05-17",
  "dueDate": "2026-10-02T10:00:00.000Z",
  "lines": [
    {
      "itemId": "66e01a1f4b8c9d001b333333",
      "warehouseId": "66e01a1f4b8c9d001b777777",
      "quantity": "100.00",
      "rate": "780.00",
      "discount": {
        "type": "amount",
        "value": "3000.00"
      },
      "taxPolicyId": "66e01a1f4b8c9d001b666666"
    }
  ],
  "payments": [
    {
      "accountId": "66e01a1f4b8c9d001d333333",
      "amount": "30000.00",
      "mode": "bank_transfer",
      "reference": "NICA-987654"
    }
  ],
  "notes": "Delivered to Patan Site",
  "postImmediately": true
}
```
- **Response JSON (HTTP 201)**:
```json
{
  "success": true,
  "statusCode": 201,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": {
    "id": "66e01a1f4b8c9d001c111111",
    "documentNumber": "INV-2082/83-0012",
    "status": "partially_paid",
    "subtotal": "75000.00",
    "totalTaxableAmount": "75000.00",
    "totalTax": "9750.00",
    "roundOff": "0.00",
    "grandTotal": "84750.00",
    "paidAmount": "30000.00",
    "balanceDue": "54750.00",
    "createdAt": "2026-09-02T10:00:00.000Z"
  }
}
```
- **Validation**:
  - `lines`: Must contain at least 1 line item.
  - `quantity`, `rate`: Positive decimal numbers.
  - If `postImmediately: true`: Party credit limit and item stock balances are asserted.

---

### 6.2 Get Invoice Print Stream (PDF)
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId/transactions/:id/pdf`
- **Purpose**: Streams compliant A4 or 80mm thermal invoice PDF.
- **Authentication**: Bearer Token
- **Required Permission**: `sale:view`
- **Query Parameters**:
  - `format` (`a4`, `thermal80mm`)
  - `language` (`en`, `ne`, `bilingual`)
- **Response**: Binary stream `Content-Type: application/pdf`.

---

### 6.3 Process Sales Return (Credit Note)
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/transactions/credit-notes`
- **Purpose**: Records goods return against an existing invoice, reversing inventory, VAT, and accounts receivable.
- **Authentication**: Bearer Token
- **Required Permission**: `sale:reverse`
- **Request Body**:
```json
{
  "sourceInvoiceId": "66e01a1f4b8c9d001c111111",
  "date": "2026-09-03T09:00:00.000Z",
  "bsDate": "2082-05-18",
  "returnLines": [
    {
      "itemId": "66e01a1f4b8c9d001b333333",
      "quantity": "10.00",
      "returnRate": "750.00"
    }
  ],
  "reason": "Damaged cement bags returned by customer"
}
```
- **Validation**:
  - `returnLines.quantity`: Must not exceed remaining unreturned quantity from original invoice.

---

## 7. Module 6: Purchase Transactions

### 7.1 Record Purchase Bill
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/transactions/purchases`
- **Purpose**: Records incoming vendor bill, updates input tax claim, accounts payable, and stock in.
- **Authentication**: Bearer Token
- **Required Permission**: `purchase:create`
- **Request Body**:
```json
{
  "firmId": "66e01a1f4b8c9d001a222222",
  "supplierId": "66e01a1f4b8c9d001b888888",
  "supplierBillNumber": "SUP-7712",
  "date": "2026-09-02T11:00:00.000Z",
  "lines": [
    {
      "itemId": "66e01a1f4b8c9d001b333333",
      "warehouseId": "66e01a1f4b8c9d001b777777",
      "quantity": "500.00",
      "purchaseRate": "690.00",
      "taxPolicyId": "66e01a1f4b8c9d001b666666"
    }
  ],
  "postImmediately": true
}
```
- **Response JSON (HTTP 201)**: Returns purchase bill details with balanced journal entry ID.

---

## 8. Module 7: Inventory Management

### 8.1 Stock Adjustment
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/inventory/adjustments`
- **Purpose**: Manual stock corrections (damage, shrinkage, physical count reconciliation).
- **Authentication**: Bearer Token
- **Required Permission**: `inventory:adjust`
- **Request Body**:
```json
{
  "warehouseId": "66e01a1f4b8c9d001b777777",
  "itemId": "66e01a1f4b8c9d001b333333",
  "adjustmentType": "REDUCE",
  "quantity": "5.00",
  "reason": "Water damage during transit",
  "offsetAccountId": "66e01a1f4b8c9d001d888888"
}
```
- **Response JSON (HTTP 200)**: Emits generated stock movement record ID.

---

### 8.2 Inter-Warehouse Stock Transfer
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/inventory/transfers`
- **Purpose**: Moves stock between two branches or godowns without generating revenue.
- **Authentication**: Bearer Token
- **Required Permission**: `inventory:transfer`
- **Request Body**:
```json
{
  "sourceWarehouseId": "66e01a1f4b8c9d001b777777",
  "destinationWarehouseId": "66e01a1f4b8c9d001b999999",
  "date": "2026-09-03T11:00:00.000Z",
  "items": [
    {
      "itemId": "66e01a1f4b8c9d001b333333",
      "quantity": "50.00"
    }
  ]
}
```

---

## 9. Module 8: Financial Accounting

### 9.1 Post Manual Journal Entry
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/accounting/journals`
- **Purpose**: Records custom double-entry journal voucher ensuring debits equal credits.
- **Authentication**: Bearer Token
- **Required Permission**: `journal:create`
- **Request Body**:
```json
{
  "date": "2026-09-02T12:00:00.000Z",
  "narration": "Monthly office rent payment",
  "lines": [
    {
      "accountId": "66e01a1f4b8c9d001d444444",
      "debit": "50000.00",
      "credit": "0.00"
    },
    {
      "accountId": "66e01a1f4b8c9d001d333333",
      "debit": "0.00",
      "credit": "50000.00"
    }
  ]
}
```
- **Validation**:
  - `totalDebit` must strictly equal `totalCredit`.
  - Must have at least two balanced lines.

---

### 9.2 Get General Ledger Statement
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId/accounting/ledgers/:accountId`
- **Authentication**: Bearer Token
- **Required Permission**: `report:ledger:view`
- **Query Parameters**:
  - `startDate`, `endDate` (ISO dates)
- **Response JSON (HTTP 200)**: Chronological list of debits, credits, running balance, and offset accounts.

---

## 10. Module 9: Reports & Analytics

### 10.1 Nepal IRD VAT Register Report
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId/reports/vat`
- **Purpose**: Returns statutory sales and purchase VAT summaries conforming to Nepal Inland Revenue Department Annex 5 format.
- **Authentication**: Bearer Token
- **Required Permission**: `report:vat:view`
- **Query Parameters**:
  - `fiscalYear` (e.g. `"2082/83"`)
  - `month` (e.g. `"05"`)
- **Response JSON (HTTP 200)**:
```json
{
  "success": true,
  "statusCode": 200,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": {
    "period": "2082-05",
    "salesRegister": {
      "taxableAmount": "12500000.00",
      "exemptAmount": "450000.00",
      "vatCollected": "1625000.00"
    },
    "purchaseRegister": {
      "taxableAmount": "8500000.00",
      "exemptAmount": "120000.00",
      "vatPaidClaimable": "1105000.00"
    },
    "netVatPayable": "520000.00"
  }
}
```

---

### 10.2 Profit & Loss Statement
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId/reports/profit-loss`
- **Authentication**: Bearer Token
- **Required Permission**: `report:pnl:view`
- **Query Parameters**:
  - `startDate`, `endDate`
- **Response JSON (HTTP 200)**: Structured revenue, COGS, gross margin, operating expenses, and net net profit.

---

## 11. Module 10: System Operations

### 11.1 Query Audit Logs
- **Method**: `GET`
- **Endpoint**: `/api/v1/organizations/:orgId/audit-logs`
- **Authentication**: Bearer Token
- **Required Permission**: `audit:view`
- **Query Parameters**:
  - `page` (default 1), `limit` (default 50)
  - `resourceType` (`transaction`, `party`, `item`, `settings`)
  - `action` (`transaction.posted`, `party.updated`)
  - `startDate`, `endDate`
- **Response JSON (HTTP 200)**: Paginated stream of append-only audit events with deep diff snapshots.

---

### 11.2 Trigger Manual Organization Data Backup
- **Method**: `POST`
- **Endpoint**: `/api/v1/organizations/:orgId/backups`
- **Purpose**: Dispatches an asynchronous worker job to export all organization collections to an encrypted archive.
- **Authentication**: Bearer Token
- **Required Permission**: `backup:create`
- **Response JSON (HTTP 202 Accepted)**:
```json
{
  "success": true,
  "statusCode": 202,
  "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
  "data": {
    "jobId": "job-backup-881239",
    "status": "queued",
    "message": "Backup generation started. You will receive a notification upon completion."
  }
}
```

---

*End of Smart Billing ERP Production REST API Specification v1.0*
