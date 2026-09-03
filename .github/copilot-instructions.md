# TUMC Gear — Copilot Instructions

## What this application is

A climbing-club gear management system ("TUMC Gear"). It tracks inventory items, categories, printed QR tags, loans (checkout/return/cancel), and found-item reports, with an admin dashboard and overdue-loan email reminders.

## Stack

- **Monorepo**: npm workspaces (`backend`, `frontend`) at repo root. All packages are ESM (`"type": "module"`).
- **Frontend**: React 19 + Vite 7, MUI 7 (`@mui/material`, `@emotion`), React Router 7, TanStack Query 5, axios, `@supabase/supabase-js`, leaflet/react-leaflet (maps), `html5-qrcode` (scanning), `qrcode.react` + `nanoid` (tag generation). Plain JS/JSX — no TypeScript.
- **Backend**: Node 22 + Express 5, `zod` (imported as `zod/v4`), `pino`/`pino-http` logging, `helmet`, `cors`, `express-rate-limit`, `jose` (JWT verify), `nodemailer` + Handlebars templates, `swagger-jsdoc`/`swagger-ui-express`.
- **Database**: PostgreSQL (Supabase) via **Prisma 5** (`backend/prisma/schema.prisma`). Uses both `DATABASE_URL` (pooled) and `DIRECT_URL`.

## Authentication & authorization

- Auth is delegated to **Supabase Auth**. The frontend signs in with `supabase.auth.signInWithPassword` and stores the session; `AuthContext` pushes the access token into the axios client via `setAccessToken()` (do **not** call `supabase.auth.getSession()` per request).
- The backend never issues tokens. `authenticate` middleware verifies the Supabase JWT against the remote JWKS (`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`), with `issuer` and `audience: "authenticated"` checks.
- On first authenticated request, the middleware **just-in-time provisions** a local `User` row keyed by the Supabase UUID (`payload.sub`); a missing `full_name` in user metadata yields `403 PROFILE_INCOMPLETE`. Inactive/soft-deleted users get `401`.
- Roles are `MEMBER` and `ADMIN` on the local `User` model. Authorization is enforced by `requireRole("ADMIN")` on routes. `optionalAuth` is used where responses vary for anonymous vs authenticated callers.
- Frontend route guards: `ProtectedRoute` and `AdminRoute` — these are UX only; **the backend is the security boundary**.

## API architecture

- REST, mounted in `backend/src/routes/index.js`: `/health`, `/categories`, `/item`, `/items`, `/qr`, `/loans`, `/users`, `/found-reports`, `/dashboard`.
- Strict layering — keep it: **route → middleware (`authenticate`/`optionalAuth`/`requireRole`/`validate`) → controller → service → prisma**. Controllers are thin (`try/catch` + `next(err)`); all business logic and Prisma access live in `src/services/*`.
- Validation: zod schemas are declared inline in the route file and applied with `validate(schema, "body" | "params" | "query")`. Note: for `source === "query"` the parsed result is **not** written back (Express 5 `req.query` is read-only).
- Errors: throw `new AppError(statusCode, ERROR_CODE, message, details)`. The `errorHandler` returns a consistent envelope `{ error, message, details }` with UPPER_SNAKE_CASE codes (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`). Unhandled errors are logged and returned as generic `500` — never leak internals.
- Pagination: use `buildPaginationQuery` / `buildPaginationMeta` from `src/utils/pagination.js` (max `pageSize` 100, sort fields must be allow-listed).
- Every route is documented with `@swagger` JSDoc blocks; Swagger UI is served at `/api-docs` **only when `NODE_ENV !== "production"`**. Keep new/changed endpoints documented.
- Rate limiting: `globalRateLimiter` is applied app-wide; `publicRateLimiter` (stricter) is applied to unauthenticated public endpoints (QR resolution, found-report submission).

## Data model constraints

- **Soft delete** is implemented as a Prisma client extension in `src/config/prisma.js` for `User`, `Item`, `Category`, `Loan`, `FoundReport`. `findMany`/`findFirst`/`findUnique`/`count` automatically filter `deletedAt: null`. Pass `includeDeleted: true` in the query args to bypass it (used for uniqueness checks). `create`/`update`/`delete` are **not** intercepted — deletes must set `deletedAt` in the service.
- `Loan` is the source of truth for item availability. **One ACTIVE loan per item** is enforced by a partial unique index in `backend/prisma/manual_indexes.sql` (not expressible in Prisma). Similar partial unique indexes limit open found reports per item/reporter. After `prisma migrate deploy`, `manual_indexes.sql` must also be executed (`npm run db:migrate` in `backend` does both).
- Items have a human-readable `shortId` (VarChar 11) built from a 3-char auto-generated unique `Category.prefix`; QR tags have a 6-char unique `nanoid`. Frontend routes use these: `/item/:shortId`, `/t/:nanoid`.

## Directory structure

```
backend/src/
  app.js server.js            # express app / listener
  config/  env.js jwks.js logger.js prisma.js swagger.js
  routes/ controllers/ services/   # one file per resource, same names
  middleware/ authenticate optionalAuth requireRole validate errorHandler rateLimiter
  mailer/  email.js layout.hbs partials/ templates/
  jobs/    overdueReminders.js      # standalone script, run via cron
  utils/   AppError.js pagination.js
backend/prisma/  schema.prisma migrations/ manual_indexes.sql
frontend/src/
  services/   # axios wrappers per resource + api.js + supabase.js
  hooks/      # TanStack Query hooks per resource (use*.js)
  features/   # resource-specific composite UI (items, loans, users, tags, foundReports)
  components/ pages/ pages/admin/ layouts/ routes/ context/ utils/ theme.js
```

Frontend data flow convention: `services/*.js` (axios) → `hooks/use*.js` (`useQuery`/`useMutation`, array query keys like `["categories"]`, invalidate on success) → components. Do not call axios directly from components.

## Environment

- Backend (`backend/.env`, validated by zod in `src/config/env.js` — process exits on invalid): `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `CORS_ORIGINS` (comma-separated), `PORT` (default 3000), `NODE_ENV`, optional `SMTP_*`. Add any new env var to the schema.
- Frontend (`frontend/.env`, see `frontend/.env.example`): `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`, `VITE_APP_TITLE`, `VITE_FOOTER_TEXT`. Only `VITE_`-prefixed vars reach the browser — never put secrets there.

## Running, building, testing, linting

```bash
npm run dev                 # root: backend (node --watch) + frontend (vite --host) concurrently
npm run lint                # root: eslint . (flat config, eslint.config.js)
npm run lint:fix
npm run format:check        # root: prettier --check .
npm run format

cd backend && npm run dev   # node --watch --env-file .env src/server.js
cd backend && npm start     # node src/server.js
cd backend && npm run db:migrate   # prisma migrate deploy + manual_indexes.sql
cd backend && npx prisma generate  # after schema changes
cd backend && npm test      # vitest (configured; no test files committed yet)

cd frontend && npm run build     # vite build  (the only build step in the repo)
cd frontend && npm run preview
cd frontend && npm test          # node --test (configured; no test files committed yet)
```

There is **no TypeScript and no typecheck step**. There is currently **no committed test suite** — do not claim tests pass; if you add tests, use `vitest` + `supertest` on the backend and `node --test` on the frontend, matching the configured runners.

### Validating changes

Always run, from the repo root:

```bash
npm run lint && npm run format:check
```

Plus `cd frontend && npm run build` for frontend changes, and `cd backend && npx prisma validate` (and `npx prisma generate`) for schema changes. CI (`.github/workflows/ci.yml`) runs only ESLint + Prettier on PRs to `main`, so those must pass.

## Infrastructure / deployment

- `.github/workflows/deploy.yml`: on pushes to `main` touching `backend/**`, SSHes to the VPS, pulls `/opt/apps/tumc-gear`, builds the backend image, runs `npm run db:migrate` in a one-off backend container, and recreates the backend service from the compose project in `/opt/apps/supabase`. `prisma-migrate.yml` is a manual (`workflow_dispatch`) migration job.
- `backend/Dockerfile`: `node:22-slim`, installs `openssl` (Prisma requirement), runs `npx prisma generate`, exposes 3000, `npm start`. Root `docker-compose.yml` builds `./backend` with `env_file: ./backend/.env`.
- The frontend is a static Vite build; it is not part of the backend deploy workflow.
- `backend/src/jobs/overdueReminders.js` is a one-shot script (calls `main()` on import) intended to be scheduled externally; it emails users with loans overdue when no reminder was sent in the last 2 days and stamps `User.lastOverdueEmailSentAt`.

## Coding conventions actually used here

- ESM `import`/`export` everywhere; backend relative imports include the `.js` extension, frontend imports omit extensions.
- Named exports for services/controllers/middleware/hooks; controllers import services as `import * as xService from "../services/x.js"`, routes import controllers as `import * as ctrl from ...`.
- Prettier defaults with `endOfLine: "lf"` (`.prettierrc`); double quotes, semicolons, trailing commas as produced by Prettier.
- ESLint flat config: `js/recommended` + `eslint-plugin-react` (React 19, `react-in-jsx-scope` and `prop-types` off). Unused vars are errors unless prefixed with `_` — hence `_req`, `_res`, `_next`.
- Zod is imported from `"zod/v4"` on the backend.
- Comments are used sparingly to explain non-obvious workarounds; keep that style rather than commenting every line.

## Security assumptions

- All trust decisions are made server-side from the verified JWT (`req.user`), never from client-supplied ids or roles.
- The Supabase anon key is public by design; service-role keys and SMTP credentials must stay in backend `.env` only.
- CORS is restricted to `CORS_ORIGINS`; `helmet` is enabled; rate limiters guard public endpoints — do not remove or loosen these.
- Never expose Swagger UI, stack traces, or Prisma error internals in production responses.
- Prefer Prisma query builders (parameterized). Raw SQL is confined to `manual_indexes.sql`.
