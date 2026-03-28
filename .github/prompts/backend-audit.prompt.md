---
description: "Audit backend code for convention violations, security issues, and bugs against project standards"
agent: "agent"
tools: [read, search]
argument-hint: "Optional: specific domain to audit (e.g. 'loans', 'items') or leave blank for full audit"
---

# Backend Code Audit

Audit the backend codebase for bugs, security issues, and violations of project conventions.

## Reference Standards

Read these files first — they define what "correct" looks like:

- [Backend patterns](../instructions/backend-api.instructions.md) — layer structure, ESM imports, Zod validation, AppError, pagination
- [System spec](../../backend/docs/system-spec-backend.md) — full API reference, business rules, state machines, error codes, roles & permissions
- [Prisma schema](../../backend/prisma/schema.prisma) — database models and relations

## Scope

If an argument was provided, audit only that domain's files (route, controller, service). Otherwise audit all domains under `backend/src/`.

## Audit Checklist

### 1. Layer Structure

- Routes define Zod schemas inline and apply middleware in correct order: `authenticate → requireRole → validate → controller`
- Controllers are thin — only extract request data, call service, set status code, call `next(err)`
- Services contain all business logic and throw `AppError` — not controllers or routes
- No direct Prisma calls in controllers or routes

### 2. Security

- All protected endpoints have `authenticate` middleware
- Admin endpoints have `requireRole("ADMIN")`
- Public endpoints (QR resolve, found reports) have `publicRateLimiter`
- No raw SQL or string interpolation in queries
- All user input is validated through Zod schemas before reaching controllers
- No secrets or credentials hardcoded in source files

### 3. Validation

- Zod schemas cover all expected fields with appropriate constraints (min, max, regex, etc.)
- PATCH schemas use `.optional()` on all fields
- Nullable fields use `.nullable()`
- Query param validation uses `validate(schema, 'query')`

### 4. Error Handling

- Every controller handler wraps in `try/catch` and calls `next(err)`
- Services throw `AppError(statusCode, errorCode, message)` with UPPER_SNAKE_CASE codes
- Correct HTTP status codes: 201 for creates, 204 for deletes, 409 for uniqueness conflicts, 422 for business-rule violations
- Error codes match those documented in the system spec

### 5. Prisma & Data Access

- Soft-delete is respected — no manual `deletedAt IS NULL` filters unless using `{ includeDeleted: true }`
- Pagination uses `buildPaginationQuery` and `buildPaginationMeta` from `utils/pagination.js`
- Response shape for list endpoints is flat: `{ data, page, pageSize, totalCount, totalPages }`
- No N+1 query patterns — use `include` or `select` for relations
- Transactions used where multiple writes must be atomic

### 6. ESM & Code Style

- All imports use `.js` extensions
- Named exports for services and controllers, default export for Router
- No CommonJS (`require`, `module.exports`)

### 7. Business Rules

- Cross-check service logic against the system spec's business rules (e.g. one active loan per item, max 30 days, geolocation required, category prefix uniqueness)
- State machine transitions are enforced (loan states, found report states)

## Output Format

For each finding, report:

- **File**: workspace-relative path with line number
- **Severity**: `Critical` (security/data-loss risk), `Warning` (convention violation or bug), `Info` (minor improvement)
- **Issue**: What is wrong
- **Fix**: What should change (include a code snippet if helpful)

Group findings by domain (items, loans, categories, etc.), then by severity within each group.

End with a summary table:

| Severity | Count |
| -------- | ----- |
| Critical | _n_   |
| Warning  | _n_   |
| Info     | _n_   |
