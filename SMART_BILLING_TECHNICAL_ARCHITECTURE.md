# SMART BILLING ERP SYSTEM
## Technical Architecture Document
### Version 1.0 | September 2026

> **Derivation**: Derived from [SMART_BILLING_ERP_SRS.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/SMART_BILLING_ERP_SRS.md), [NEPAL_IMPLEMENTATION_SPEC.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/NEPAL_IMPLEMENTATION_SPEC.md), and [WEB_APP_BLUEPRINT.md](file:///c:/Users/bsmar/Desktop/Smart%20Billing/WEB_APP_BLUEPRINT.md).  
> **Status**: Architecture & Design Blueprint Only (No implementation code).  
> **Tech Stack**: Node.js + Express + TypeScript (Backend), React + TypeScript (Frontend), MongoDB (Database), Docker + Nginx (Deployment).  
> **Jurisdiction Defaults**: Nepal (NPR, Asia/Kathmandu, Bikram Sambat display, IRD VAT/PAN compliance).

---

## Table of Contents

1. [Architectural Overview & System Topology](#1-architectural-overview--system-topology)
2. [Backend Architecture (Node.js + Express + TypeScript)](#2-backend-architecture-nodejs--express--typescript)
   - 2.1 Layered Architecture Pattern (Controller-Service-Repository)
   - 2.2 Directory & Modular Folder Structure
   - 2.3 Middleware Pipeline
   - 2.4 Authentication & Session Lifecycle
   - 2.5 Role-Based Access Control (RBAC) Engine
   - 2.6 Request Validation Strategy
   - 2.7 Centralized Error Handling Framework
   - 2.8 Logging, Observability & Tracing
3. [Frontend Architecture (React + TypeScript)](#3-frontend-architecture-react--typescript)
   - 3.1 Architectural Principles & Application Shell
   - 3.2 Feature-Based Modular Folder Structure
   - 3.3 Routing Architecture & Route Guards
   - 3.4 State Management Strategy (Server vs. Client State)
   - 3.5 API Integration & Data Fetching Layer
   - 3.6 Shared UI Design System & Component Hierarchy
   - 3.7 Form Handling & Dynamic Calculators
   - 3.8 Table, Grid & Data Presentation Architecture
4. [Database Architecture (MongoDB)](#4-database-architecture-mongodb)
   - 4.1 Schema Modeling & Multi-Tenancy Strategy
   - 4.2 Comprehensive Indexing Strategy
   - 4.3 Relationship Integrity & Foreign References
   - 4.4 Multi-Document ACID Transactions & Concurrency Control
   - 4.5 Immutable Audit Trail & Change Data Capture
5. [Deployment, Infrastructure & Operations](#5-deployment-infrastructure--operations)
   - 5.1 Containerization with Docker & Multi-Stage Builds
   - 5.2 Nginx Reverse Proxy & Load Balancing Configuration
   - 5.3 SSL/TLS & Transport Security
   - 5.4 Automated Database Backup & Disaster Recovery Strategy
   - 5.5 Environment Configuration & Secrets Management
6. [Cross-Cutting Architectural Invariants](#6-cross-cutting-architectural-invariants)

---

## 1. Architectural Overview & System Topology

### 1.1 High-Level Architecture Diagram

```
                              ┌────────────────────────────────────────────────────────┐
                              │                    Client Tier                         │
                              │  Desktop Browser / Mobile Web / POS Device / Tablet    │
                              └──────────────────────────┬─────────────────────────────┘
                                                         │ HTTPS (Port 443) / WSS
                                                         ▼
                              ┌────────────────────────────────────────────────────────┐
                              │                   Edge & Proxy Tier                    │
                              │           Nginx Reverse Proxy & SSL Termination        │
                              │   - Rate Limiter (IP / User)    - Static Asset Cache   │
                              │   - Security Headers (CSP, HSTS) - Request ID Injector  │
                              └─────────────┬────────────────────────────┬─────────────┘
                                            │                            │
                     Static Assets & SPA    │                            │ /api/v1/*
                                            ▼                            ▼
                 ┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
                 │       Frontend Web Application       │  │        Backend API Cluster        │
                 │      React 19 + TypeScript (SPA)     │  │   Node.js + Express + TypeScript  │
                 │   - Feature-Sliced Architecture      │  │   - Stateless Clustered Processes │
                 │   - TanStack Query + Zustand         │  │   - Controller-Service-Repository │
                 │   - Dual Gregorian / BS Calendar     │  │   - In-Memory Server Calculations │
                 └──────────────────────────────────────┘  └─────────────────┬─────────────────┘
                                                                             │
                                           ┌─────────────────────────────────┴───────────────────────────────┐
                                           │                                                                 │
                                           ▼                                                                 ▼
                        ┌─────────────────────────────────────┐                    ┌───────────────────────────────────┐
                        │      Primary Data Store (MongoDB)   │                    │     Asynchronous Worker Cluster   │
                        │    Replica Set with Multi-Doc ACID  │                    │   BullMQ / Redis Job Processors   │
                        │  - Organization Tenancy Isolation   │◀───────────────────│  - PDF Rendering (Puppeteer)      │
                        │  - Immutable Financial Journal      │  (Pub/Sub Outbox)  │  - Bulk Excel / CSV Imports       │
                        │  - Decimal128 Money Precision       │                    │  - SMS / Email / WhatsApp Alerts  │
                        │  - Automated Point-in-Time Oplog    │                    │  - Nightly Balance Materializer   │
                        └─────────────────────────────────────┘                    └───────────────────────────────────┘
```

### 1.2 Architectural Core Tenets

1. **Strict Server Financial Authority**: The front-end renders preview calculations for real-time operator responsiveness, but the backend recalculates and verifies every single line discount, tax component, document charge, rounding adjustment, and grand total using `Decimal128` arithmetic.
2. **Organization-Scoped Tenant Boundary**: Every single database query, index, and cache entry incorporates `organizationId`. Cross-tenant data leakage is prevented via global tenant isolation middleware and schema-level query interceptors.
3. **Draft-vs-Posted Immutability Pattern**: Transactions in `draft` state are freely mutable. Once transitioned to `posted`, a document becomes cryptographically immutable. Corrections require formal reversing documents (`credit_note`, `debit_note`, or compensating `reversal` records).
4. **Offline-Safe Eventual Processing**: Heavy side-effects (PDF generation, IRD invoice reporting, audit logging, SMS notifications) are dispatched asynchronously via transactional outbox patterns, decoupling core booking from network volatility.

---

## 2. Backend Architecture (Node.js + Express + TypeScript)

### 2.1 Layered Architecture Pattern (Controller-Service-Repository)

The backend strictly segregates concerns into five decoupled architectural layers:

```
 HTTP Request ──▶ [Routing Layer] 
                        │
                        ▼
                 [Middleware Layer] (Rate limit, Auth, Org-Context, Validation)
                        │
                        ▼
                 [Controller Layer] (HTTP parsing, DTO extraction, status responses)
                        │
                        ▼
                 [Service / Domain Layer] (Business rules, tax calculation, ACID orchestrations)
                        │
                        ▼
                 [Repository / Data Layer] (Mongoose models, Mongo queries, sessions, aggregates)
                        │
                        ▼
                 [Database (MongoDB)]
```

- **Routing Layer**: Declares API routes, methods, and attaches specific validation schemas and authorization guards.
- **Controller Layer**: Decouples Express HTTP protocol concerns (`req`, `res`, `next`) from business rules. Extracts typed DTOs and delegates directly to Domain Services.
- **Domain Service Layer**: Implements pure business logic, fiscal validation, tax calculation pipeline, double-entry journal balance checking, stock allocation, and database transaction boundaries. Never references Express request or response objects.
- **Repository Layer**: Encapsulates all data access, schema projections, Mongoose aggregate pipelines, and atomic updates. Enforces mandatory `organizationId` scoping.
- **Domain Entities & Types**: Strong TypeScript interfaces specifying domain invariants, DTO contracts, and calculation results.

### 2.2 Directory & Modular Folder Structure

```text
backend/
├── src/
│   ├── @types/                     # Express request augmentations & global types
│   │   └── express.d.ts            # Attaches user, organizationId, correlationId to Request
│   ├── config/                     # Environment configuration & service singletons
│   │   ├── database.ts             # MongoDB connection pool & Mongoose settings
│   │   ├── env.ts                  # Zod-validated environment variable bindings
│   │   ├── logger.ts               # Winston/Pino logger setup
│   │   └── redis.ts                # Redis client for queues & rate limiting
│   ├── constants/                  # Business constants & enumeration dictionaries
│   │   ├── errorCodes.ts           # Machine-readable error codes
│   │   ├── permissions.ts          # Granular system permissions list
│   │   └── taxDefaults.ts          # Nepal IRD default tax rates & account maps
│   ├── middleware/                 # Cross-cutting HTTP middleware
│   │   ├── authenticate.ts         # JWT verification & token validation
│   │   ├── authorize.ts            # RBAC permission evaluation
│   │   ├── errorHandler.ts         # Centralized HTTP error handler
│   │   ├── idempotency.ts          # Idempotency-Key validation & response replay
│   │   ├── rateLimiter.ts          # Redis-backed sliding window rate limiter
│   │   ├── tenantContext.ts        # Validates and sets active organization scope
│   │   ├── traceId.ts              # Injects X-Correlation-ID tracing header
│   │   └── validateRequest.ts      # Zod request validation wrapper
│   ├── modules/                    # Feature/Domain modules (Screaming Architecture)
│   │   ├── auth/                   # Authentication & Token Management
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── organization/           # Tenant, Firm, Branch, Fiscal Year
│   │   ├── parties/                # Customers & Suppliers
│   │   ├── items/                  # Catalog, Services, Units, Categories
│   │   ├── inventory/              # Stock movements, Adjustments, Valuations
│   │   ├── transactions/           # Sales, Purchases, Invoices, Returns, Reversals
│   │   │   ├── dtos/               # CreateTransactionDto, PostTransactionDto
│   │   │   ├── engine/             # Calculation engine, pipeline stages
│   │   │   │   ├── discountStage.ts
│   │   │   │   ├── taxStage.ts
│   │   │   │   └── roundingStage.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── transaction.model.ts
│   │   │   ├── transaction.repository.ts
│   │   │   ├── transaction.router.ts
│   │   │   ├── transaction.service.ts
│   │   │   └── transaction.validation.ts
│   │   ├── accounting/             # Chart of Accounts, Journal Entries, Ledgers
│   │   ├── payments/               # Payment-In, Payment-Out, Allocations
│   │   ├── banking/                # Cash/Bank Accounts, Cheques, Transfers
│   │   ├── tax/                    # VAT Policies, Withholding (TDS) Rules
│   │   ├── reports/                # Balance sheet, P&L, Daybook, VAT registers
│   │   ├── audit/                  # Audit events, system logs
│   │   └── imports/                # Excel/CSV batch import engine
│   ├── queue/                      # Background worker queues (BullMQ)
│   │   ├── queue.constants.ts
│   │   ├── workers/
│   │   │   ├── pdfWorker.ts        # Headless Chrome PDF generation
│   │   │   ├── importWorker.ts     # Batch spreadsheet processing
│   │   │   └── notificationWorker.ts # Outbox event delivery
│   │   └── queues.ts
│   ├── utils/                      # Pure functional helper utilities
│   │   ├── bikramSambat.ts         # Dual-calendar conversion utilities (AD <-> BS)
│   │   ├── decimal.ts              # Precise Decimal128 math wrapper functions
│   │   └── sequenceGenerator.ts    # Concurrency-safe atomic document numbering
│   ├── app.ts                      # Express app initialization & middleware mounting
│   └── server.ts                   # Process bootstrapper, clustering, graceful shutdown
├── tests/
│   ├── integration/
│   ├── unit/
│   └── fixtures/
├── Dockerfile
├── tsconfig.json
└── package.json
```

### 2.3 Middleware Pipeline

Every HTTP request traverses a strictly ordered sequence of Express middleware components:

```
[Incoming Request]
        │
        ▼
1. Trace Identifier Injector (`traceId.ts`)
   - Reads or generates RFC-4122 `X-Correlation-ID`.
   - Binds to asynchronous context (AsyncLocalStorage) for downstream logging.
        │
        ▼
2. HTTP Request Logger (`requestLogger.ts`)
   - Structured JSON logging of method, URL, user agent, IP, and correlation ID.
        │
        ▼
3. Security Headers & CORS (`helmet`, `cors`)
   - Restricts origin to known application domain.
   - Enforces CSP, HSTS, X-Content-Type-Options, Frameguard.
        │
        ▼
4. Rate Limiter (`rateLimiter.ts`)
   - Tiered token-bucket/sliding-window via Redis.
   - Public auth endpoints: 10 req/min; Authenticated operations: 120 req/min.
        │
        ▼
5. Body Parser (`express.json()`)
   - Validates JSON payload size (max 2MB, import endpoints max 20MB).
        │
        ▼
6. Authentication Guard (`authenticate.ts`)
   - Extracts Bearer token from `Authorization` header.
   - Verifies cryptographic signature using RSA-256 public key.
   - Decodes `userId` and attaches to `req.user`.
        │
        ▼
7. Tenant & Organization Context (`tenantContext.ts`)
   - Extracts `organizationId` from route parameter `/api/v1/organizations/:orgId`.
   - Asserts user's active membership in target organization.
   - Hydrates `req.tenant = { organizationId, firmId, fiscalYearId }`.
        │
        ▼
8. RBAC Authorization Guard (`authorize.ts`)
   - Evaluates required permission string (e.g. `sale:create:any`) against user's assigned role.
        │
        ▼
9. Idempotency Key Processor (`idempotency.ts`)
   - Mandatory on `POST /transactions`, `POST /payments`, `POST /imports`.
   - Checks Redis/MongoDB for cached responses matching `(organizationId, idempotencyKey)`.
   - Replays previous response immediately if key is cached; locks key if in-flight.
        │
        ▼
10. Schema Validation (`validateRequest.ts`)
    - Validates `req.params`, `req.query`, and `req.body` against module Zod schemas.
    - Yields HTTP 422 with fine-grained error list if validation fails.
        │
        ▼
[Route Controller Handler]
        │
        ▼
[Global Error Handling Middleware (`errorHandler.ts`)]
```

### 2.4 Authentication & Session Lifecycle

```
[User Client]                                         [Auth Service]                          [Database / Redis]
      │                                                     │                                          │
      │ 1. POST /api/v1/auth/login (Phone/Email + Pass)    │                                          │
      ├────────────────────────────────────────────────────▶│                                          │
      │                                                     │ 2. Fetch User & Verify Argon2id Hash     │
      │                                                     ├─────────────────────────────────────────▶│
      │                                                     │◀─────────────────────────────────────────┤
      │                                                     │                                          │
      │                                                     │ 3. Generate Access Token (JWT, 15m)      │
      │                                                     │    Generate Refresh Token (Opaque UUID)  │
      │                                                     │ 4. Store Refresh Token Hash in DB/Redis  │
      │                                                     ├─────────────────────────────────────────▶│
      │                                                     │◀─────────────────────────────────────────┤
      │ 5. Returns { accessToken, refreshToken, user }      │                                          │
      │◀────────────────────────────────────────────────────┤                                          │
      │                                                     │                                          │
      │ 6. Subsequent API Call with Bearer JWT              │                                          │
      ├────────────────────────────────────────────────────▶│ (Local RSA-256 Public Key Verification) │
      │                                                     │                                          │
      │ 7. POST /api/v1/auth/refresh (RefreshToken)         │                                          │
      ├────────────────────────────────────────────────────▶│ 8. Validate, Invalidate Old Token,       │
      │                                                     │    Issue New Pair (Token Rotation)       │
      │                                                     ├─────────────────────────────────────────▶│
      │ 9. Returns new { accessToken, refreshToken }        │◀─────────────────────────────────────────┤
      │◀────────────────────────────────────────────────────┤                                          │
```

- **Access Token Specification**: JWT signed via RS256; short lifespan (15 minutes). Payload contains `sub` (User ID), `email`, and system flags. It does **not** hardcode organization-specific permissions, allowing instant permission changes without invalidating the token.
- **Refresh Token Specification**: Cryptographically secure random 256-bit string stored hashed (SHA-256) in MongoDB. Has a 7-day sliding expiration.
- **Token Rotation**: Every refresh request burns the consumed refresh token and issues a fresh pair. If a revoked or used refresh token is presented, the entire token family is immediately purged (compromise detection).

### 2.5 Role-Based Access Control (RBAC) Engine

Permissions strictly adhere to the structured format: `resource:action:scope`.

- **Resource**: `sale`, `purchase`, `payment`, `expense`, `party`, `item`, `inventory`, `report`, `settings`, `audit`, `backup`.
- **Action**: `create`, `update`, `delete`, `view`, `post`, `reverse`, `import`, `export`.
- **Scope**: `own` (restricted to records where `createdBy === req.user.id`), `any` (unrestricted within the tenant organization).

#### Permission Check Execution Flow

```
1. `tenantContext` resolves user's role inside the active `organizationId`.
2. `authorize(['sale:create:any', 'sale:create:own'])` middleware executes.
3. If user holds `sale:create:any` -> Request advances immediately.
4. If user holds only `sale:create:own` -> Request advances with `req.permissionScope = 'own'`, causing the downstream Repository query or mutation filter to inject `{ createdBy: req.user.id }`.
5. If neither permission is held -> Rejects with HTTP 403 Forbidden:
   `{ "code": "AUTH_FORBIDDEN_RESOURCE", "message": "Missing required permission: sale:create" }`.
```

### 2.6 Request Validation Strategy

All inputs are validated using **Zod** schemas executed before hitting any controller:

- **Strict Schema Enforcement**: Schemas specify `.strict()` to reject unknown and malicious fields outright.
- **Coercion & Sanitization**: Strings are trimmed; numbers are parsed with custom decimal validators that prevent JavaScript IEEE-754 floating-point truncation.
- **Unified Error Representation**:
  ```json
  {
    "success": false,
    "code": "VALIDATION_FAILED",
    "message": "Invalid input parameters provided.",
    "correlationId": "c8b4d82c-47b2-4d51-8e01-140f7b031bdf",
    "errors": [
      {
        "field": "lines[0].rate",
        "message": "Rate must be a positive decimal string with up to 2 decimal places.",
        "received": "-12.5"
      }
    ]
  }
  ```

### 2.7 Centralized Error Handling Framework

All internal application exceptions extend a standard `AppError` base class:

```
                  ┌───────────────────────────────┐
                  │           AppError            │
                  │ - statusCode: number          │
                  │ - errorCode: string           │
                  │ - isOperational: boolean      │
                  │ - correlationId: string       │
                  └───────────────┬───────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐          ┌───────────────────┐
│NotFoundError │          │ConflictError │          │LedgerBalanceError │
│(404)         │          │(409)         │          │(422)              │
└──────────────┘          └──────────────┘          └───────────────────┘
```

#### Global Error Interception Mechanism

1. **Operational Errors** (`isOperational: true`): Expected domain errors (e.g., stock depletion, out-of-balance journal, duplicate invoice sequence). Emits standard response JSON and logs at `WARN` level.
2. **Programmer / System Errors** (`isOperational: false`): Uncaught exceptions or database connection failures. Emits generic HTTP 500 (`INTERNAL_SERVER_ERROR`), redacts stack traces from clients, and triggers high-priority `ERROR` alerts with complete context and stack traces.

### 2.8 Logging, Observability & Tracing

- **Logger Framework**: High-performance structured logging using **Pino** formatting JSON payloads to `stdout`.
- **Context Preservation**: Utilizes Node.js `AsyncLocalStorage` to automatically append `correlationId`, `organizationId`, and `userId` to every log line without manual threading.
- **Redaction Policy**: Field-level mask engine automatically scrubs credit cards, passwords, bank account numbers, and personal identification numbers from output logs.
- **Health & Metrics**:
  - `/healthz` — Liveness probe (asserts HTTP server responds).
  - `/readyz` — Readiness probe (asserts MongoDB connection pool active and writable).
  - `/metrics` — Prometheus endpoint scraping latency histograms and memory footprints.

---

## 3. Frontend Architecture (React + TypeScript)

### 3.1 Architectural Principles & Application Shell

The frontend is structured as an enterprise-grade Single Page Application (SPA) leveraging **React 19**, **TypeScript**, and **Vite**:

- **Predictable Performance**: Zero expensive UI layout reflows; virtualized lists for multi-thousand transaction tables; minimal client bundle size via route-level code splitting.
- **Offline-Aware Local State**: Instant optimistic updates during billing entry; drafts cached to browser IndexedDB; background sync verification when connectivity fluctuates.
- **Strict Separation of Concerns**: Views strictly handle presentation; data fetching belongs to TanStack Query hooks; client form calculations reside in isolated, unit-tested calculation utility modules.

### 3.2 Feature-Based Modular Folder Structure

The project adopts a domain-driven **Feature-Sliced Design** architecture:

```text
frontend/
├── public/
│   ├── favicon.ico
│   └── locales/                    # i18n translation resources (en.json, ne.json)
├── src/
│   ├── app/                        # Root application wrappers & providers
│   │   ├── App.tsx                 # Root component mounting providers
│   │   ├── Router.tsx              # React Router v7 definition
│   │   └── providers/              # QueryClientProvider, AuthProvider, ThemeProvider
│   ├── assets/                     # Global static assets (SVGs, branding logos)
│   ├── components/                 # Shared domain-agnostic UI component library
│   │   ├── data-display/           # DataTable, StatCard, Badge, Timeline
│   │   ├── feedback/               # Toast, ConfirmDialog, Skeleton
│   │   ├── forms/                  # TextInput, MoneyInput, DatePicker, SelectDropdown
│   │   ├── layout/                 # AppShell, Sidebar, TopBar, BottomNav
│   │   └── overlays/               # ModalDialog, DrawerPanel
│   ├── features/                   # Independent vertical slices of business capabilities
│   │   ├── auth/                   # Login, OTP verification, Password recovery
│   │   ├── dashboard/              # Analytics charts, Quick stats, Recent stream
│   │   ├── sales/                  # Invoices, Credit Notes, Estimates, Orders
│   │   │   ├── api/                # TanStack query hooks (useInvoices, useCreateInvoice)
│   │   │   ├── components/         # LineItemTable, DocumentTotals, PaymentSplit
│   │   │   ├── hooks/              # useInvoiceCalculator, useBarcodeScanner
│   │   │   ├── pages/              # InvoiceListPage, InvoiceCreatePage, InvoiceDetailPage
│   │   │   ├── types/              # Invoice, InvoiceLine, CalculationResult
│   │   │   └── utils/              # Client-side validation & formatting helpers
│   │   ├── purchases/              # Bills, Debit Notes, Supplier Orders
│   │   ├── parties/                # Customers, Suppliers, Ledgers, Aging Statements
│   │   ├── items/                  # Catalog, Inventory Balances, Unit Conversions
│   │   ├── banking/                # Cash in Hand, Bank Accounts, Cheques
│   │   ├── reports/                # Daybook, Profit & Loss, Balance Sheet, VAT Return
│   │   └── settings/               # Organization, Firms, Fiscal Years, Tax Policies
│   ├── hooks/                      # Global reusable React hooks
│   │   ├── useDebounce.ts
│   │   ├── useKeyboardShortcut.ts
│   │   └── usePermission.ts        # Client-side permission evaluation
│   ├── services/                   # HTTP client instance & interceptor configuration
│   │   ├── apiClient.ts            # Axios instance with auth & error interceptors
│   │   └── tokenStorage.ts         # Secure in-memory token holder
│   ├── stores/                     # Global cross-cutting state (Zustand)
│   │   ├── authStore.ts            # User identity, active org, firm selection
│   │   └── uiStore.ts              # Sidebar toggle, active modal, active theme
│   ├── styles/                     # Pure CSS design system tokens
│   │   ├── variables.css           # Color tokens, typography, shadows, borders
│   │   ├── reset.css
│   │   └── print.css               # Clean A4 / POS thermal print stylesheets
│   ├── types/                      # Common TypeScript interfaces & API response shapes
│   └── utils/                      # Formatting & arithmetic functions
│       ├── currencyFormatter.ts    # NPR formatting (e.g. NPR 1,23,456.78)
│       └── nepaliCalendar.ts       # Bikram Sambat parser & calendar converter
├── index.html
├── tsconfig.json
└── vite.config.ts
```

### 3.3 Routing Architecture & Route Guards

Routes are declared declaratively with authenticated boundary wrappers:

```
                                  [Route Hierarchy]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         [Public Routes]                                 [Protected Routes]
         - /auth/login                                   (Requires Valid JWT)
         - /auth/verify-otp                                       │
         - /auth/forgot-password                                  ▼
                                                        [Organization Guard]
                                                        (Asserts valid active company)
                                                                  │
                                                                  ▼
                                                      ┌───────────────────────┐
                                                      │   AppShell Layout     │
                                                      │  - Sidebar / TopBar   │
                                                      └───────────┬───────────┘
                                                                  │
             ┌─────────────────────┬──────────────────────────────┼─────────────────────────────┐
             ▼                     ▼                              ▼                             ▼
       [Dashboard]          [Sales Module]                [Reports Module]              [Settings Module]
     /app/:orgId/home      /app/:orgId/sales/*          /app/:orgId/reports/*         /app/:orgId/settings/*
                           (Permission Guard:           (Permission Guard:            (Permission Guard:
                            'sale:view')                 'report:pnl:view')            'settings:company:update')
```

- **Authentication Guard (`AuthGuard`)**: Intercepts unauthenticated sessions and redirects to `/auth/login` while preserving desired destination URL in query parameters.
- **Organization Guard (`OrgGuard`)**: Validates that `:orgId` corresponds to an organization the user belongs to; prompts company selector if unselected.
- **Permission Guard (`PermissionGuard`)**: Renders fallback 403 screen or hides actions if the authenticated role lacks the required capability.

### 3.4 State Management Strategy (Server vs. Client State)

State is cleanly partitioned into two distinct categories to eliminate synchronization bugs:

| State Dimension | Tooling | Responsibility |
|---|---|---|
| **Server Cache State** | **TanStack Query v5** | Remote data fetching, caching, deduplication, cache invalidation on mutations, optimistic updates, background refetching. |
| **Global Client State** | **Zustand** | Ephemeral, non-server state: active organization/firm ID, collapsed sidebar state, active calendar mode (Gregorian vs. BS), active toast notifications. |
| **Local Form State** | **React Hook Form** | Highly performant, uncontrolled inputs for document lines, instant keypress responses, field-level validation errors. |

### 3.5 API Integration & Data Fetching Layer

- **Axios HTTP Client Singleton**: Configured with baseUrl `/api/v1`, default timeout (15s), and request/response interceptors.
- **Automatic Request Header Injection**: Injects `Authorization: Bearer <token>`, `X-Correlation-ID`, and `Idempotency-Key` (on financial mutations).
- **Silent Refresh Interceptor**: If an API returns HTTP 401, the interceptor queues in-flight requests, calls `/api/v1/auth/refresh`, updates in-memory token, and transparently retries queued calls without disrupting user experience.

### 3.6 Shared UI Design System & Component Hierarchy

- **Color Tokens**: Curated palette with slate surfaces, deep sapphire accents, emerald status (paid), amber (overdue), and rose (credit/debt notes). Fully dark-mode ready via CSS custom properties.
- **Typography**: Native display support utilizing Inter for Latin numerals and Noto Sans Devanagari for Nepali scripts.
- **Form Control Invariants**:
  - `MoneyInput`: Strips illegal characters, formats display using South Asian numbering format (`1,00,000.00`), internally emits raw numeric strings to avoid float corruption.
  - `BSDatePicker`: Accessible modal displaying Bikram Sambat months (Baishakh to Chaitra) with instant synchronization to underlying Gregorian accounting date.

### 3.7 Form Handling & Dynamic Calculators

The **Transaction Editor** (`TransactionForm`) encapsulates complex reactive billing requirements:

```
[User edits Line Qty / Rate / Discount]
                    │
                    ▼ (Uncontrolled Change Event)
[React Hook Form Controller]
                    │
                    ▼
[Client Calculation Engine Hook (`useInvoiceCalculator`)]
   ├── 1. Recalculates line discount & line taxable base
   ├── 2. Applies selected Tax Policy (13% VAT / Exempt)
   ├── 3. Computes document subtotal
   ├── 4. Distributes document-level discount & shipping charges
   ├── 5. Applies Nepal Round-off policy
   └── 6. Computes Grand Total, Paid Amount, and Balance Due
                    │
                    ▼
[Live UI Render: DocumentTotals Panel & InvoicePreview]
                    │
                    ▼ (User clicks 'Post')
[API Mutation: POST /transactions/:id/post]
                    │
                    ▼
[Server Validation & Authoritative Recalculation]
```

### 3.8 Table, Grid & Data Presentation Architecture

- **DataTable Core**: Built with **TanStack Table v8**.
- **Virtualization**: Uses `@tanstack/react-virtual` for row rendering, easily handling 10,000+ transaction lines at a consistent 60 FPS without DOM thrashing.
- **Keyboard Navigation**: Spreadsheet-like keyboard traversal (Enter / Tab / Arrow navigation) in transaction tables to support rapid desktop data entry.
- **Unified Filtering**: Supports combined compound filters (Date Range, Party, Status, Search) preserved in browser URL query parameters for reproducible bookmarking and sharing.

---

## 4. Database Architecture (MongoDB)

### 4.1 Schema Modeling & Multi-Tenancy Strategy

Multi-tenancy utilizes a **Pooled Collection (Shared Database, Organization Discriminator)** model:

- **Discriminator Enforcement**: Every single collection (excluding system global tables) includes `organizationId: { type: Schema.Types.ObjectId, required: true, index: true }`.
- **Mongoose Middleware Layer**: Pre-find and pre-aggregate hooks inject `{ organizationId: currentOrgId }` into queries automatically.
- **Storage Types**:
  - Currency & Financial Amounts: `mongoose.Schema.Types.Decimal128` (arbitrary-precision BSON decimal).
  - Dates: BSON `Date` (stored as UTC). Bikram Sambat dates are persisted alongside as denormalized display strings (`bsDate: "2082-05-15"`).

### 4.2 Comprehensive Indexing Strategy

Compound indexes are tailored to avoid in-memory sorting and support rapid index-covered queries:

```javascript
// Transactions Collection
db.transactions.createIndex(
  { organizationId: 1, type: 1, status: 1, date: -1 },
  { name: "idx_transactions_org_type_status_date" }
);
db.transactions.createIndex(
  { organizationId: 1, documentNumber: 1 },
  { unique: true, name: "uidx_transactions_org_docnumber" }
);
db.transactions.createIndex(
  { organizationId: 1, partyId: 1, date: -1 },
  { name: "idx_transactions_org_party_date" }
);
db.transactions.createIndex(
  { idempotencyKey: 1 },
  { unique: true, sparse: true, name: "uidx_transactions_idempotency" }
);

// Journal Entries Collection
db.journal_entries.createIndex(
  { organizationId: 1, date: -1 },
  { name: "idx_journal_org_date" }
);
db.journal_entries.createIndex(
  { organizationId: 1, transactionId: 1 },
  { name: "idx_journal_org_transaction" }
);
db.journal_entries.createIndex(
  { organizationId: 1, "lines.accountId": 1, date: -1 },
  { name: "idx_journal_org_account_date" }
);

// Stock Movements Collection
db.stock_movements.createIndex(
  { organizationId: 1, itemId: 1, storeId: 1, date: -1 },
  { name: "idx_stock_movements_org_item_store_date" }
);
db.stock_movements.createIndex(
  { organizationId: 1, transactionId: 1 },
  { name: "idx_stock_movements_org_transaction" }
);

// Parties Collection
db.parties.createIndex(
  { organizationId: 1, type: 1, name: 1 },
  { name: "idx_parties_org_type_name" }
);
db.parties.createIndex(
  { organizationId: 1, "taxIdentity.panNumber": 1 },
  { sparse: true, name: "idx_parties_org_pan" }
);

// Audit Events Collection
db.audit_events.createIndex(
  { organizationId: 1, timestamp: -1 },
  { name: "idx_audit_org_timestamp" }
);
db.audit_events.createIndex(
  { organizationId: 1, resourceType: 1, resourceId: 1 },
  { name: "idx_audit_org_resource" }
);

// Idempotency Keys (TTL Index for Auto-Cleanup)
db.idempotency_keys.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "ttl_idempotency_keys" }
);
```

### 4.3 Relationship Integrity & Foreign References

While MongoDB is non-relational, financial integrity requires explicit foreign key validation:

- **Referential Integrity Validation**: Handled programmatically within Domain Services before executing mutations (e.g., verifying `partyId`, `storeId`, `taxPolicyId` belong to the same `organizationId`).
- **Denormalized Snapshots**: When creating transactions, critical master data is permanently copied into the document lines (`itemName`, `itemCode`, `unitName`, `taxPolicyVersion`). If an item's name or price changes in the master catalog later, historical posted invoices remain pristine and unchanged.

### 4.4 Multi-Document ACID Transactions & Concurrency Control

All financial posting operations execute inside explicit MongoDB Client Sessions:

```
                  ┌─────────────────────────────────────────┐
                  │   Start Client Session & Transaction    │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 1. Atomic Sequence Number Generation    │
                  │    findOneAndUpdate() with Incr         │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 2. Mutate Document Status               │
                  │    draft ──▶ posted (with snapshot)     │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 3. Create Balanced Journal Entries      │
                  │    Assert: Total Debits == Credits      │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 4. Insert Atomic Stock Movements        │
                  │    Decrement Store Inventory Lots       │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 5. Insert Payment Allocations & Balances│
                  │    Adjust Party Receivable / Payable    │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 6. Append Immutable Audit Trail Log     │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 7. Insert Transactional Outbox Event    │
                  └────────────────────┬────────────────────┘
                                       │
                     Success? ─────────┴───────── Exception?
                        │                               │
                        ▼                               ▼
        ┌───────────────────────────────┐  ┌───────────────────────────────┐
        │ Commit Transaction & End      │  │ Abort Transaction (Rollback)  │
        │ Session                       │  │ & End Session                 │
        └───────────────────────────────┘  └───────────────────────────────┘
```

- **Optimistic Concurrency Control (OCC)**: Master documents (`Item`, `Party`, `Transaction`) utilize an integer `version` field. Updates specify `{ _id, version: currentVersion }`. If another process updated the record concurrently, the write returns 0 matched records, triggering an immediate `ConflictError`.

### 4.5 Immutable Audit Trail & Change Data Capture

- **Audit Collection Structure**: The `audit_events` collection is strictly append-only. MongoDB user permissions for the application user revoke `delete` and `update` privileges on this specific collection.
- **Payload Schema**: Captures `userId`, `action`, `resourceType`, `resourceId`, deep structural diff (`before` and `after`), user agent, IP address, and correlation trace ID.

---

## 5. Deployment, Infrastructure & Operations

### 5.1 Containerization with Docker & Multi-Stage Builds

The system packages into lightweight, security-hardened container images:

```
[Stage 1: Build Stage (Node.js Alpine)]
- Compiles TypeScript into JavaScript
- Prunes development dependencies
- Bundles frontend with Vite
          │
          ▼
[Stage 2: Production Runtime (Node.js Distroless / Alpine)]
- Non-root user execution (`USER node`)
- Only production node_modules included
- Read-only root filesystem
- Minimal attack surface (no shell / curl in distroless)
```

#### Container Ecosystem Configuration (`docker-compose.prod.yml`)

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.27-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/ssl/certs:ro
      - static_volume:/usr/share/nginx/html:ro
    depends_on:
      - api
    networks:
      - app_network

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5000
    env_file:
      - ./backend/.env.production
    depends_on:
      - mongodb
      - redis
    networks:
      - app_network

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: ["node", "dist/queue/workerRunner.js"]
    restart: always
    env_file:
      - ./backend/.env.production
    depends_on:
      - mongodb
      - redis
    networks:
      - app_network

  mongodb:
    image: mongo:7.0
    restart: always
    command: ["--replSet", "rs0", "--bind_ip_all"]
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    environment:
      - MONGO_INITDB_ROOT_USERNAME_FILE=/run/secrets/mongo_root_user
      - MONGO_INITDB_ROOT_PASSWORD_FILE=/run/secrets/mongo_root_pass
    networks:
      - app_network

  redis:
    image: redis:7.2-alpine
    restart: always
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    volumes:
      - redis_data:/data
    networks:
      - app_network

volumes:
  mongo_data:
  mongo_config:
  redis_data:
  static_volume:

networks:
  app_network:
    driver: bridge
```

### 5.2 Nginx Reverse Proxy & Load Balancing Configuration

Nginx acts as the secure perimeter gateway:

- **SSL Termination**: Terminates TLS 1.3; redirects all plain HTTP traffic on port 80 to port 443 with HSTS enabled.
- **Static Asset Serving**: Serves frontend SPA assets directly from static cache with aggressive caching headers (`Cache-Control: public, max-age=31536000, immutable` for hashed bundles).
- **Fallback Routing**: Routes all non-asset requests to `index.html` to support client-side React Router navigation.
- **API Upstream Proxying**: Forwards `/api/*` requests to Node.js backend cluster with `X-Forwarded-For`, `X-Forwarded-Proto`, and WebSocket upgrade support.
- **Buffer & Body Constraints**: Restricts request payload to 2MB standard (20MB on file import endpoints) to prevent buffer exhaustion DoS attacks.

### 5.3 SSL/TLS & Transport Security

- **Cipher Suite**: High-security TLS 1.3 and modern TLS 1.2 ciphers (`ECDHE-ECDSA-AES128-GCM-SHA256`, `ECDHE-RSA-AES128-GCM-SHA256`).
- **Certbot / Let's Encrypt**: Automated certificate generation and renewal hooks via Certbot container.
- **HTTP Security Headers**:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';`

### 5.4 Automated Database Backup & Disaster Recovery Strategy

- **Backup Topology**: Daily full database backups combined with continuous MongoDB Oplog (Change Streams) archiving for Point-in-Time Recovery (PITR).
- **Execution Tool**: Containerized cron task running `mongodump --archive --gzip --oplog`.
- **Encryption & Offsite Replication**: Backups are encrypted via AES-256 (GPG) prior to egress and replicated to secure offsite S3-compatible cloud object storage.
- **Retention Schedule**:
  - Hourly snapshots: Retained 24 hours.
  - Daily snapshots: Retained 30 days.
  - Monthly closing snapshots: Retained 7 years (tax audit compliance).
- **Disaster Recovery Drills**: Automated monthly staging restore verification checking schema consistency and trial balance equality.

### 5.5 Environment Configuration & Secrets Management

- **Zero Hardcoded Secrets**: Absolute ban on credentials or keys inside version control.
- **Zod Runtime Configuration Validator**: Upon process startup, `env.ts` evaluates all `process.env` keys against a strict Zod contract; boots abort immediately with explicit diagnostic logs if any variable is absent or malformed.
- **Separation of Environments**: Dedicated isolated profiles: `.env.development`, `.env.test`, `.env.staging`, `.env.production`.
- **Secret Storage in Production**: Production secrets mounted via Docker Secrets or HashiCorp Vault.

---

## 6. Cross-Cutting Architectural Invariants

| Invariant | System Enforcement Rule |
|---|---|
| **Decimal Precision** | Floating point `number` is prohibited for currency. All math must use `Decimal128` (MongoDB) and decimal math wrappers on backend and frontend. |
| **Journal Balance Equality** | $\sum \text{Debits} \equiv \sum \text{Credits}$ must evaluate to exact zero difference on every posted journal entry. |
| **Document Sequence Monotonicity** | Document sequences (`INV-2082/83-0001`) must never contain gaps under normal posting and are generated atomically via MongoDB `findOneAndUpdate`. |
| **Tenant Isolation** | No database read or write may execute without an explicit `organizationId` parameter filter. |
| **Calendar Coexistence** | Gregorian dates serve as the system's single source of temporal truth. Bikram Sambat is a pure bidirectional projection layer for user presentation and filtering. |
| **Audit Immutability** | Audit logs and posted financial records cannot be modified or deleted by any application role or administrative API. |

---

*End of Smart Billing ERP Technical Architecture Document v1.0*
