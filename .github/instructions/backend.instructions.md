---
applyTo: "backend/**"
description: "Conventions and facts for the TUMC Gear Express/Prisma backend."
---

# Backend instructions

## Runtime & framework

- Node 22, Express 5, **ESM only** (`"type": "module"` in `backend/package.json`).
- Relative imports **must include the `.js` extension** (`import { prisma } from "../config/prisma.js"`).
- Plain JavaScript — no TypeScript, no typecheck step.
- Prisma 5 (`@prisma/client` + `prisma`) against PostgreSQL (Supabase).
- Zod is imported as `import { z } from "zod/v4";` — never plain `"zod"`.
- Other runtime deps: `helmet`, `cors`, `express-rate-limit`, `jose`, `pino` + `pino-http`, `nodemailer`, `handlebars`.
- Top-level `await` is used in `app.js` (dynamic `import()` of Swagger) — this is fine in ESM.

## Directory layout (`backend/src`)

```
app.js                 # express app assembly + middleware order
server.js              # listener on env.PORT
config/                # env.js, logger.js, prisma.js, jwks.js, swagger.js
routes/                # index.js + one router per resource
controllers/           # one file per resource, same name as the route file
services/              # one file per resource — all business logic + Prisma access
middleware/            # authenticate, optionalAuth, requireRole, validate, errorHandler, rateLimiter
utils/                 # AppError.js, pagination.js
mailer/                # email.js, layout.hbs, partials/, templates/
jobs/                  # overdueReminders.js (one-shot script)
prisma/                # schema.prisma, migrations/, manual_indexes.sql
```

## API architecture — required layering

`route → middleware → controller → service → prisma`

- **Controllers are thin**: call one service function, set the status, `res.json(...)`, and `catch (err) { next(err); }`. No Prisma, no business rules, no validation.
- **Services own everything else**: all Prisma access, all business rules, all `AppError` throwing.
- Import style is fixed:
  - routes: `import * as ctrl from "../controllers/items.js";`
  - controllers: `import * as itemService from "../services/items.js";`
- Routers are **default exports** (`export default router`). `routes/items.js` additionally exports a named `itemsListRouter`.
- Controllers, services, middleware and utils use **named exports**.
- Mount new routers in `backend/src/routes/index.js`. Current mounts: `/health`, `/categories`, `/item`, `/items`, `/qr`, `/loans`, `/users`, `/found-reports`, `/dashboard`.
- Middleware order in `app.js` is significant and must be preserved: `pinoHttp` → `helmet` → `cors` → `express.json` → Swagger (non-prod only) → `globalRateLimiter` → `router` → `errorHandler`.
- Middleware is chained per route: `router.post("/", authenticate, requireRole("ADMIN"), validate(createSchema), ctrl.create);`

## Request/response conventions

- Status codes: `POST` → `201`, `GET`/`PATCH` → `200`, `DELETE` → `204` with `res.status(204).end()`.
- Single resources are returned **unwrapped** (`res.json(item)`), not inside a `data` envelope.
- Paginated lists return the flat shape produced by services:
  ```js
  return { data, ...buildPaginationMeta(p, ps, totalCount) };
  // => { data: [...], page, pageSize, totalCount, totalPages }
  ```
- Pagination must go through `backend/src/utils/pagination.js`:
  - `buildPaginationQuery({ page, pageSize, sortBy, sortOrder, allowedSortFields })` → `{ skip, take, orderBy, page, pageSize }`.
  - Defaults `page = 1`, `pageSize = 50`; `pageSize` is hard-capped at 100.
  - `sortBy` is applied only if it appears in `allowedSortFields` — otherwise silently ignored. **Always pass an explicit allow-list** (never user input) to keep sorting safe.
  - `buildPaginationMeta(page, pageSize, totalCount)` → `{ page, pageSize, totalCount, totalPages }`.
- List services fetch rows and count in parallel: `await Promise.all([prisma.x.findMany({...}), prisma.x.count({ where })])`.
- Every endpoint carries an `@swagger` JSDoc block above the route in the route file. Keep these in sync when adding or changing endpoints.
- Boolean-ish query params are declared as `z.enum(["true", "false"])` and compared as strings (`req.query.includeLoans === "true"`).

## Authentication

- The backend **never issues tokens**. It verifies Supabase-issued JWTs.
- `authenticate` (`middleware/authenticate.js`):
  - Requires an `Authorization: Bearer <token>` header, else `401 UNAUTHORIZED`.
  - Verifies with `jose`'s `jwtVerify` against the remote JWKS from `config/jwks.js`, asserting `issuer` = `SUPABASE_URL` + `/auth/v1` and `audience: "authenticated"`. Verification failure → `401 UNAUTHORIZED`.
  - **Just-in-time provisioning**: looks up `prisma.user.findUnique({ where: { id: payload.sub }, includeDeleted: true })`; if absent, creates a local `User` from `payload.sub`, `payload.email`, `payload.user_metadata.full_name`. A missing `full_name` → `403 PROFILE_INCOMPLETE`. A concurrent-create `P2002` is handled by re-fetching.
  - `user.deletedAt` set or `user.isActive === false` → `401 UNAUTHORIZED`.
  - On success sets `req.user` to the full local `User` row.
- `optionalAuth` (`middleware/optionalAuth.js`): same verification, but **never errors** — a missing/invalid token or lookup failure just leaves `req.user` undefined. Use it for endpoints whose response varies for anonymous vs authenticated callers.
- Derive identity only from `req.user` (from the verified JWT). Never trust a client-supplied user id or role in the body/query/params.

## Authorization

- Roles live on the local `User.role` (`Role` enum: `MEMBER` | `ADMIN`, default `MEMBER`).
- Route-level: `requireRole(...roles)` — no `req.user` → `401 UNAUTHORIZED`; role not in the list → `403 FORBIDDEN`. It must be placed **after** `authenticate`/`optionalAuth`.
- Ownership and self-service rules (e.g. a member may only return/extend their own loan, an admin may not demote or delete themselves) are enforced **in the service layer**, not in middleware.
- Admin-only response enrichment is decided in the controller/service from `req.user?.role === "ADMIN"` (see `controllers/items.js` `get`).

## Validation

- Zod schemas are declared **inline at the top of the route file** — there is no shared schema directory.
- Apply with `validate(schema, source)` where `source` is `"body"` (default), `"params"`, or `"query"`.
- `validate` (`middleware/validate.js`) uses `safeParse`; on failure it calls `next(new AppError(400, "BAD_REQUEST", "Validation failed.", details))` where `details` is `[{ path, message }]`.
- **`req.query` is not reassigned** — Express 5 makes it a read-only getter, so query values stay as raw strings even when the schema coerces. Read coerced values from the schema only if you re-parse; otherwise treat `req.query.*` as strings.
- Query schemas use `.strict()` so unknown query params are rejected; use `z.coerce.number().int().min(1)` for `page`, and `.max(100)` for `pageSize` to mirror the pagination cap.

## Error handling

- Throw `new AppError(statusCode, errorCode, message, details = {})` from services; controllers forward with `next(err)`.
- `errorHandler` is the last middleware. For `AppError` it logs at `warn` and responds with the original status and:
  ```json
  { "error": "<errorCode>", "message": "<message>", "details": {} }
  ```
  Anything else is logged at `error` as `"Unhandled error"` and returned as a generic `500 { "error": "INTERNAL_ERROR", "message": "An unexpected error occurred.", "details": {} }`.
- Never leak stack traces, Prisma internals, or raw DB errors in responses.
- Error codes in use (UPPER_SNAKE_CASE) and their status codes:
  - `400 BAD_REQUEST`
  - `401 UNAUTHORIZED`
  - `403 FORBIDDEN`
  - `403 PROFILE_INCOMPLETE`
  - `404 NOT_FOUND`
  - `409 CONFLICT`
  - `409 QR_ALREADY_ASSIGNED` (carries `details` describing the existing assignment)
  - `422 UNPROCESSABLE_ENTITY` (business-rule violations)
  - `429 RATE_LIMITED` (emitted directly by the rate limiters)
  - `500 INTERNAL_ERROR`

  Reuse these codes; do not invent new ones without a reason.

- Translate known Prisma errors rather than letting them bubble: `Prisma.PrismaClientKnownRequestError` with `err.code === "P2002"` (unique violation) or `"P2034"` (write conflict / deadlock) is mapped to a `409 CONFLICT`. Re-throw `AppError` unchanged first (`if (err instanceof AppError) throw err;`).

## Database access

- Always import the extended client: `import { prisma } from "../config/prisma.js";`. Do not instantiate `PrismaClient` elsewhere.
- **Soft delete** is a Prisma client extension in `config/prisma.js` covering `User`, `Item`, `Category`, `Loan`, `FoundReport`:
  - `findMany`, `findFirst`, `count` get `deletedAt: null` merged into `where`.
  - `findUnique` runs the query and filters the soft-deleted row out in JS (returns `null`).
  - Pass `includeDeleted: true` in the query args to bypass the filter (used for uniqueness checks and in `authenticate`).
  - `create`, `update`, `delete` are **not** intercepted — implement deletion as `prisma.x.update({ where: { id }, data: { deletedAt: new Date() } })`. Never call `prisma.x.delete()` for these models.
- Prisma logs `error` and `warn` as events, piped into the pino logger.
- Concurrency-sensitive operations (loan create/return/cancel/extend, QR assignment) run in `prisma.$transaction(async (tx) => {...}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })`, and use `tx` (not `prisma`) inside the callback.
- Prefer `include`/`select` to avoid N+1 queries; use `select` when narrowing user data (`{ id, email, fullName }`).
- Schema conventions (`prisma/schema.prisma`): PascalCase models and enums, camelCase fields, UPPER_SNAKE_CASE enum values, no `@map`. Enums: `Role`, `LoanStatus` (`ACTIVE`/`RETURNED`/`CANCELLED`), `FoundReportStatus` (`OPEN`/`CLOSED`).
- Some invariants live in `prisma/manual_indexes.sql` as partial unique indexes that Prisma cannot express — one `ACTIVE` loan per item, one open anonymous found report per item, one open found report per item+reporter. They are applied by `npm run db:migrate`, which runs `prisma migrate deploy` **and** `prisma db execute --file prisma/manual_indexes.sql`. If you add a partial/conditional index, add it there and keep it `IF NOT EXISTS`-safe.
- Raw SQL is confined to `manual_indexes.sql`; use Prisma query builders (parameterized) everywhere else.

## Logging

- Use the shared logger: `import { logger } from "../config/logger.js";`.
- `pino` level is `"info"` in production and `"debug"` otherwise, with `pino-pretty` transport only outside production.
- Structured call style: `logger.warn({ err, statusCode }, message)` — object first, message second.
- `pino-http` already logs every request/response; do not add per-request logging middleware.
- Do not log tokens, JWT payloads, SMTP credentials, or connection strings.

## Configuration / environment

- All env access goes through `import { env } from "../config/env.js";` — never read `process.env` directly outside that file.
- `config/env.js` validates with Zod and calls `process.exit(1)` on failure. **Any new env var must be added to that schema.**
- Required: `DATABASE_URL` (pooled), `DIRECT_URL` (direct, for migrations), `SUPABASE_URL` (must be a URL), `CORS_ORIGINS` (comma-separated origins).
- Optional with defaults: `PORT` (coerced number, default `3000`), `NODE_ENV` (`development` | `production` | `test`, default `development`).
- Optional SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Local dev loads `backend/.env` via `node --watch --env-file .env`.

## Security-sensitive conventions

- `helmet()` and `cors({ origin: env.CORS_ORIGINS.split(",").map(o => o.trim()) })` are applied app-wide — do not remove or widen (no `origin: "*"`).
- Rate limiting (`middleware/rateLimiter.js`, both 1-hour windows, `standardHeaders: true`, `legacyHeaders: false`):
  - `globalRateLimiter` — `max: 1000`, applied app-wide in `app.js`.
  - `publicRateLimiter` — `max: 50`, applied to unauthenticated public endpoints (QR resolution, found-report submission). Any new public/unauthenticated endpoint should get it.
- Swagger UI is gated: `if (env.NODE_ENV !== "production")` — it and `config/swagger.js` are dynamically imported only outside production. Keep that gate.
- Secrets (service-role keys, SMTP credentials, DB URLs) stay in `backend/.env` and are never returned in responses or logged.
- All trust decisions come from the verified JWT via `req.user`.

## Email & jobs

- Send mail through `sendEmail({ to, subject, template, data })` in `mailer/email.js`; it renders `templates/<template>.hbs` with Handlebars and wraps it in `layout.hbs`. Add new templates under `mailer/templates/`, shared fragments under `mailer/partials/`.
- `jobs/overdueReminders.js` is a one-shot script that calls `main()` on import and is scheduled externally (cron), not from the server process. It reuses the service layer and stamps `User.lastOverdueEmailSentAt`.

## Testing

- Test runner is **vitest** (`cd backend && npm test`), with `supertest` available for HTTP-level tests. There is **no vitest config file and no committed test files** — do not claim backend tests pass.
- If adding tests, use vitest + supertest and match the existing ESM/`.js`-extension import style.

## Commands to validate backend changes

```bash
# from repo root — these are what CI runs and must pass
npm run lint
npm run format:check

# from backend/
npx prisma validate          # after any schema.prisma change
npx prisma generate          # regenerate client after schema changes
npm run dev                  # node --watch --env-file .env src/server.js
npm run db:migrate           # prisma migrate deploy + manual_indexes.sql
npm test                     # vitest (no tests committed yet)
```

- ESLint flat config lives at the repo root (`eslint.config.js`); `no-unused-vars` is an error unless the name is prefixed with `_` — hence `_req`, `_res`, `_next`.
- Prettier (`.prettierrc`, `endOfLine: "lf"`, otherwise defaults: double quotes, semicolons, trailing commas) formats the whole repo; run `npm run format` before committing.
