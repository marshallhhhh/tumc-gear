# Project Overview

**App Name:** Climbing Club items Manager

**Purpose:**  
Track and manage climbing item inventory, including loans, QR code scanning, and found/lost reports.

**Users:**

- Anyone (non-members): scan QR codes, report found items
- Members: Can view items, checkout and return items.
- Admins: Can manage items, assign QR codes, close found reports.

# User Journeys

## PUBLIC (non-member, unauthenticated)

### Sign up via a sign up page

- user visits website
- user is presented with the abilility to sign up
- after sign up and email confirmation user is granted the MEMBER role

### Report lost

- user scans a qr code
- user is presented a form to file a lost report

## MEMBER

### QR Checkout

- user scans a QR code
- the QR code takes them to a page where they can checkout the item
- user must agree to share location
- checking out creates a loan

### QR Return

- user scans a QR code of an item they have checked out
- user is given the option to return the item
- user must agree to share location
- returning sets the loan status to returned

### ShortID Checkout

- user enters a shortID
- they are taken to a page where they can checkout the item
- user must agree to share location
- checking out creates a loan

### ShortID return

- user enters a shortID of an item they have checked out
- user is given the option to return the item
- user must agree to share location
- returning sets the loan status to returned

### View my loans

- users visits a page which shows their loans
- loans are separated into returned/cancelled and active

### View myprofile

- user visits a page with their profile details
- user can upate their name or email address

## Admin

- admins have access to all features that members have

### view all items

- admin visits a page with all items in a table
- table shows relevant items details; checked out status, etc
- clicking on an item takes them to the itemss detail page

### view all users

- admin visits a page that lists all users in a table
- table shows relevant user details
- clicking on a user takes them to a page showing the users details and their active loans

### view all loans

- admin visits a page that lists all loans in a table
- table shows relevant loan details
- clicking on a loan shows more detailed info

### associate QR

- admin scans a QR code or enters a nanoid
- if no existing qr object exists, one is created
- then the admin can associate that QR code with any item that does not already have a qr code

### unassociate QR

- admin can remove an existing QR tag association from an item
- the QR tag remains in the system but is no longer linked to any item

### Dashboard

- admin accesses a dashboard which shows
  - total number of items
  - number of checked out items
  - number of open found reports
  - number of active loans
  - number of overdue loans
  - number of total users
- clicking on any of these elements should take the admin to a page with shows a list of relevant objects

# Tech Stack

- Database: PostgreSQL hosted in Supabase
- Auth: managed by Supabase (JWT, remote JWKS verification)
- Backend: Node.js + Express (ES Modules, "type": "module" in package.json)
- ORM: Prisma v5 (with $extends for soft-delete)
- Validation: Zod v4
- Logging: pino, pino-http
- Rate limiting: express-rate-limit (5/hr per IP on public endpoints)
- Frontend: React, Vite, Material UI components

# Folder Structure

/backend
.env.example
.gitignore
/docs
/src
app.js
server.js
/config
env.js
logger.js
prisma.js
/middleware
authenticate.js
optionalAuth.js
requireRole.js
validate.js
rateLimiter.js
errorHandler.js
/utils
AppError.js
pagination.js
/routes
index.js
categories.js
items.js
qr.js
loans.js
users.js
foundReports.js
dashboard.js
/controllers
categories.js
items.js
qr.js
loans.js
users.js
foundReports.js
dashboard.js
/services
categories.js
items.js
qr.js
loans.js
users.js
foundReports.js
dashboard.js
/prisma
schema.prisma
manual_indexes.sql

# Authentication

- Supabase JWT auth (remote JWKS verification)
- Bearer token required for all authenticated endpoints
- On first successful authentication, user object is auto-created in DB (with MEMBER role, name/email from JWT)
- Inactive or soft-deleted users cannot authenticate (401 error)
- User role is stored in DB (not in JWT)
- Full name must match: only letters, spaces, hyphens, apostrophes, periods (no numbers)

# Domain Model

- Defined in `./backend/prisma/schema.prisma`

# Business Rules

- An item can have at most one active Loan (enforced by DB index)
- Checking out and returning loans require user to share location (latitude/longitude)
- QR tags (nanoid) are unique, immutable, and exactly 6 characters (admin provides nanoid)
- Each Item can have 0 or 1 QR tags
- shortId is auto-generated: `{PREFIX}-{###}` (category prefix, sequential number, 3+ digits)
- FoundReports can only be closed by Admins
- Only admins can soft-delete items; users cannot delete items
- Users can only view and return their own loans
- Items cannot be deleted if they have an active loan
- Loans: max 30 days (enforced on create/extend)
- Category names are changeable, but prefix is immutable once set (collision handled by incrementing last letter)
- Loan is overdue if `dueDate < startOfToday AND status = ACTIVE`
- Returning an item sets `returnDate = now()` and `status = RETURNED` (even if overdue)
- Item is AVAILABLE if no active loan and not soft-deleted

# State Transitions

**Loan**

- ACTIVE → RETURNED
- ACTIVE → CANCELLED

**Item Availability** (derived)

- AVAILABLE → CHECKED_OUT → AVAILABLE
- Can be RETIRED/LOST via admin actions

**FoundReport**

- OPEN → CLOSED (only by admin)

# Roles & Permissions

PUBLIC

- Create FoundReport

MEMBER

- View item
- Scan QR code
- Loan item
- Return Item
- View Own Loans

ADMIN

- Create/Update/Delete Item
- Assign/Unassign QR tags
- Close FoundReports
- Override Loans
- View All Loans

# Schema outline

see schema.prisma for full details

```
model User {
  id        String   @id  // supabase auth UUID
  email     String
  fullName  String?
  role      Role     // can be set by admin
  isActive  Boolean  // can be toggle by admin
  createdAt DateTime
  updatedAt DateTime
  deletedAt DateTime? // soft delete

  loans   Loan[]
  loansCancelled Loan[] @relation("LoanCancelledBy")
}

model Item {
  id              String
  name            String
  description     String?
  categoryId      String?
  category        Category? @relation(fields: [categoryId], references: [id])

  serialNumber    String?  // set by admin
  shortId         String  // generated at creation - immutable once set

  createdAt       DateTime
  updatedAt       DateTime
  deletedAt       DateTime? // soft delete

  // RELATIONS
  loans        Loan[]
  foundReports FoundReport[]
  qrTag        QrTag?
}

model QrTag {
  id      String @id @default(uuid())
  nanoid  String @unique @db.VarChar(6)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  itemId  String? @unique
  item    Item?   @relation(fields: [itemId], references: [id], onDelete: SetNull)
}

model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // soft delete
  prefix   String   @unique @db.VarChar(3) // generated at creation time to be used for shortId, immutable once set

  items     Item[]
}

model Loan {
  id           String     @id @default(uuid())

  itemId       String
  item         Item       @relation(fields: [itemId], references: [id], onDelete: Restrict)

  userId       String
  user         User    @relation(fields: [userId], references: [id], onDelete: Restrict)

  status       LoanStatus @default(ACTIVE)

  dueDate      DateTime
  checkoutDate DateTime   @default(now())
  returnDate   DateTime?

  openedLatitude    Float
  openedLongitude   Float

  closedLatitude    Float?
  closedLongitude   Float?

  // set when admin cancels loan
  cancelledBy    String?
  cancelledByAdmin User?   @relation("LoanCancelledBy", fields: [cancelledBy], references: [id], onDelete: SetNull)
  cancelledAt    DateTime?

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?  // soft delete
}

model FoundReport {
  id          String

  itemId      String
  item        Item

  reportedBy  String?
  reporter    User?  // can be user or anon

  contactInfo String?
  description String?

  latitude    Float? //optional location
  longitude   Float?

  status      FoundReportStatus // can be changed by admin

  createdAt   DateTime
  closedAt    DateTime?

  closedBy    String?
  closedByAdmin User?

  deletedAt   DateTime?         // soft delete
}
```

# Rate Limiting

Public endpoints (`POST /qr/resolve`, `POST /found-reports`) are rate limited to 5 requests per hour per IP (express-rate-limit)

# Coding Standards

## Comments

- Use comments only where necessary to explain non-obvious code
- Avoid unnecessary or AI-explaining comments

## Error Handling

- Use pino/pino-http logging throughout
- Log detailed error traces (server-side)
- Never expose backend errors or stack traces to user
- All error responses use: `{ error, message, details }` (details is always an object, never null)

## HTTP Response Codes

Every response uses the most specific applicable code from this table. Do not invent codes outside this set. All error codes are upper-snake-case.

### Success

| Code | Meaning    | When to use                                                                     |
| ---- | ---------- | ------------------------------------------------------------------------------- |
| 200  | OK         | GET, PATCH, POST actions (return, cancel, close, extend)                        |
| 201  | Created    | POST that creates a resource (item, loan, QR tag, found report, category, user) |
| 204  | No Content | DELETE (soft-delete) — no body returned                                         |

### Client Errors

| Code | Meaning              | When to use                                                                                                                                                                                                           |
| ---- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400  | Bad Request          | Zod validation failure, malformed JSON, missing required fields, invalid field values (e.g. `days` < 1 or > 30)                                                                                                       |
| 401  | Unauthorized         | Missing or invalid/expired Bearer token, deleted or inactive user attempting auth                                                                                                                                     |
| 403  | Forbidden            | Authenticated user lacks the required role for the endpoint (e.g. MEMBER hitting an ADMIN route), or user trying to return/extend another user's loan                                                                 |
| 404  | Not Found            | Resource does not exist or has been soft-deleted. Also: QR tag nanoid not found or not assigned to an item                                                                                                            |
| 409  | Conflict             | Uniqueness violation: item already has an active loan, QR tag nanoid collision, duplicate category name/prefix, duplicate open found report for same item+reporter                                                    |
| 422  | Unprocessable Entity | Request is well-formed but violates a business rule: item has active loan and cannot be deleted, category has items and cannot be deleted, loan extension would exceed 30-day max, item is not available for checkout |
| 429  | Too Many Requests    | Rate limit exceeded on public endpoints                                                                                                                                                                               |

### Server Errors

| Code | Meaning               | When to use                                                                                                              |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 500  | Internal Server Error | Unhandled exceptions, database failures, unexpected errors. Log full trace server-side; return generic message to client |

### Response body shape

All error responses (4xx, 5xx) use the same envelope:

```json
{
  "error": "CONFLICT",
  "message": "This item already has an active loan.",
  "details": {}
}
```

- **error**: Upper-snake-case error code (e.g. `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UNPROCESSABLE_ENTITY`, `RATE_LIMITED`, `INTERNAL_ERROR`)
- **message**: Human-readable description safe to display in the UI
- **details**: Optional object with field-level errors (from Zod) or contextual info. Empty object `{}` when not applicable — never `null` or absent

## General

- validate user input with zod
- do not duplicate logic
  - prefer resusable, single-task functions
- No business logic in routes (controllers only)

# API Endpoints

## Guidelines

- REST API, all endpoints under `/`
- Offset pagination (default page size: 50, max 100) on all list endpoints
- All input validated with Zod
- All business logic in services, not in routes/controllers

## Items

POST /item — ADMIN only, create item (auto shortId)
GET /item/:id — public (optional auth), returns item; authenticated non-admin users get `activeLoan`; admins get `loans[]` (with user) and `foundReports[]` (with reporter, closedByAdmin)
GET /item/by-short-id/:shortId — public (optional auth), returns item by shortId; same response tiers as GET /item/:id
PATCH /item/:id — ADMIN only, update item
DELETE /item/:id — ADMIN only, soft-delete (blocked if active loan)
GET /items — ADMIN only, paginated, filters: category, hasLoan, hasQrTag, search, sort by category/name/createdAt/updatedAt; response includes `hasActiveLoan` boolean per item

## Loans

POST /loans — MEMBER/ADMIN, create loan (body: { itemId, days, latitude, longitude })
GET /loans — ADMIN only, paginated, filters: userId, itemId, status, overdue, sort by dueDate/status/createdAt/checkoutDate
GET /loans/overdue — ADMIN only, filter: overdue
GET /loans/my — MEMBER/ADMIN, current user's loans
POST /loans/:id/return — MEMBER/ADMIN, return loan (body: { latitude, longitude })
POST /loans/:id/cancel — ADMIN only, cancel loan
PATCH /loans/:id/extend — MEMBER/ADMIN, extend loan (body: { days })

## QR Tags

POST /qr/resolve — public, rate-limited, body: { nanoid } (6 chars), returns item or 404
POST /qr — ADMIN only, create QR tag (body: { nanoid }, 6 chars, admin-provided)
GET /qr — ADMIN only, paginated, filter: assigned
POST /qr/assign — ADMIN only, assign QR tag to item (body: { nanoid, itemId }; creates tag if missing; blocked if item already has QR tag)
DELETE /qr/:id/assign — ADMIN only, unassign QR tag from item (422 if not assigned)

## Users

GET /users/me — MEMBER/ADMIN, get current user
PATCH /users/me — MEMBER/ADMIN, update own name
GET /users/:id — ADMIN only, get user details (with active loans)
PATCH /users/:id — ADMIN only, update user (name/email/role/isActive)
DELETE /users/:id — ADMIN only, cancels all active loans then soft-deletes user
GET /users — ADMIN only, paginated

## Found Reports

POST /found-reports — public, rate-limited, create found report (body: { itemId, contactInfo?, description?, latitude?, longitude? })
GET /found-reports — ADMIN only, paginated, filters: itemId, status
GET /found-reports/:id — ADMIN only, get found report
POST /found-reports/:id/close — ADMIN only, close found report

## Categories

GET /categories — public, list all categories
POST /categories — ADMIN only, create category (auto prefix)
PATCH /categories/:id — ADMIN only, update name (prefix immutable)
DELETE /categories/:id — ADMIN only, soft-delete (blocked if category has non-deleted items)

# Location Tracking on loans

Users are require to allow access to their location when borrowing or returning items

# Soft Delete Filtering

All queries for soft-deletable models (User, Item, Category, Loan, FoundReport) automatically filter out records with `deletedAt != null` via Prisma $extends. Escape hatch: pass `{ includeDeleted: true }` to include deleted records.

# Data Integrity

- shortId unique per item
- nanoid unique globally
- Only one ACTIVE loan per Item
- Soft deletes: deletedAt field; queries must filter out deleted records

# QR scanning Sequences

PUBLIC
scans qr code -> item retrieved -> user submits found report

MEMBER
scans qr code > item retrieved
if item is available:
checks out item -> loan created

if item is not available:
if item is loaned by current user:
user can return item

ADMIN
scans qr code
if qrtag does not exist -> qrtag created
admin selects item to asssociate qrtag to

## Short ID generation logic

- first 3 letters are the first 3 letters of the category name in all caps. e.g. "Harness" becomes "HAR"
- followed by a hyphen
- followed by 3 digits, assigned sequentially
- e.g. "HAR-313"
- if 3 digits are ever exhausted, grow to 4 digits
- if 2 category prefixes collide. The last letter of the prefix should increment (A->B->C...->Z->A), this should repeat until there are no collisions

## Nanoid

- nano IDs are exactly 6 characters long
- retry on collision until a unique nanoid is generated

# Security

- CORS origins configured from env var (CORS_ORIGINS)
- Helmet configured for HTTP headers
- All input validated with Zod
- All endpoints use proper role-based access control
