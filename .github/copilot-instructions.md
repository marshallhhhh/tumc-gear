# TUMC Gear V2 — Project Guidelines

Gear management system for TUMC: track inventory items, QR tags, loans, and found-item reports.

## Accepting The Users Prompts

When you recieve a prompt from the users, you should validate the prompt to ensure that it is clear and specific. If the prompt is vague or ambiguous, you should ask the user for clarification before proceeding. This will help you provide a more accurate and helpful response.

If you believe the user's prompt is inappropriate or violates any guidelines, you should politely inform the user and make alternative suggestions if possible.

## Architecture

Monorepo with two independent apps sharing Supabase auth:

| Layer        | Stack                                                              | Entry                  |
| ------------ | ------------------------------------------------------------------ | ---------------------- |
| **Backend**  | Express 5 (ESM) · Prisma 5 · PostgreSQL · Zod 4 · Pino             | `backend/src/app.js`   |
| **Frontend** | React 19 · Vite 8 · MUI 7 · React Query 5 · Axios · React Router 7 | `frontend/src/App.jsx` |

**Auth flow:** Supabase issues JWTs → backend verifies via JWKS → role stored in DB (not token) → first auth auto-provisions user as MEMBER.

### Backend layers

```
Route  →  Middleware (auth, validate, rateLimit)  →  Controller (thin)  →  Service (business logic)  →  Prisma
```

Each domain (items, loans, users, categories, qr, foundReports, dashboard) follows this pattern across `routes/`, `controllers/`, `services/`.

### Frontend layers

```
Page/Feature  →  Custom Hook (React Query)  →  Service (Axios wrapper)  →  api.js (interceptors)
```

## Build & Dev

```bash
# Backend
cd backend
npm run dev          # nodemon + .env auto-loaded
npm start            # production
npm test             # vitest

# Frontend
cd frontend
npm run dev          # Vite HMR
npm run build        # production → dist/
npm run lint         # ESLint 9 flat config
```

## Key Conventions

### Backend

- **ES Modules everywhere** — `type: "module"` in package.json; use `.js` extensions in imports.
- **Validation** — Zod schemas in route files; applied via `validate(schema, source)` middleware. Return 400 with field-level errors.
- **Error handling** — Throw `AppError(statusCode, errorCode, message, details)`. Error codes are UPPER_SNAKE_CASE. The global error handler formats the response as `{ error, message, details }`.
- **Soft-delete** — Prisma `$extends` auto-filters `deletedAt IS NULL`. Pass `{ includeDeleted: true }` to bypass. All soft-deletable models have a `deletedAt` field.
- **Pagination** — Use `buildPaginationQuery(query)` and `buildPaginationMeta(page, pageSize, totalCount)` from `utils/pagination.js`. Called in the service layer. Response shape is flat: `{ data, page, pageSize, totalCount, totalPages }`.
- **Rate limiting** — Public endpoints (QR resolve, found reports) limited to 5 req/hr per IP.
- **HTTP status codes** — 201 for creates, 204 for deletes, 409 for uniqueness conflicts, 422 for business-rule violations. See `backend/docs/system-spec-backend.md`.

### Frontend

- **Data fetching** — Always use React Query hooks (`useQuery`/`useMutation`). Invalidate related query keys on mutation success. staleTime: 30s for lists, 60s for details.
- **Notifications** — Use `useNotification()` hook → `notify(message, severity)`. Severity: success | error | warning | info.
- **Auth** — Use `useAuth()` from `AuthContext`. Properties: `user`, `session`, `isAdmin`, `isMember`, `isAuthenticated`.
- **UI components** — MUI with `sx` prop for styling. Reusable components in `components/` (DataTable, StatusBadge, ConfirmDialog, LocationMinimap, QrScanner, PageSkeleton).
- **Loading states** — Use `<PageSkeleton />` for full-page loading. MUI Skeleton for inline.
- **Routing** — Public routes render directly. Protected routes use `<ProtectedRoute>`. Admin routes use `<AdminRoute>`.

## Environment Variables

### Backend (.env)

`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `CORS_ORIGINS`, `PORT` (default 3000), `NODE_ENV`

### Frontend (.env)

`VITE_API_URL`, `VITE_APP_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Documentation

- [backend/docs/system-spec-backend.md](backend/docs/system-spec-backend.md) — Full backend spec: API reference, business rules, state machines, roles & permissions, error codes, schema outline.
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) — Database schema (models: User, Item, QrTag, Category, Loan, FoundReport).

## Domain Model (quick reference)

| Model           | Key rules                                                                               |
| --------------- | --------------------------------------------------------------------------------------- |
| **Item**        | Has shortId (`{PREFIX}-{###}`, auto-generated). Cannot delete while active loan exists. |
| **QrTag**       | 6-char nanoid, 1:1 with Item. Immutable once created.                                   |
| **Category**    | Unique name + 3-char prefix. Cannot delete if items exist.                              |
| **Loan**        | One ACTIVE loan per item. Max 30 days. Requires geolocation on checkout/return.         |
| **FoundReport** | Unique per (itemId, reportedBy, status). Only admins close.                             |
| **User**        | Auto-created on first auth. Role: MEMBER (default) or ADMIN. Soft-deletable.            |

## Closing Remarks

Include a quote from a famous Chinese historical figure (e.g. Sun Tzu, Confucius, Deng Xiaoping) at the end of every chat response. This should have no effect on the content of your response, and should be clearly separated from the main content. I just want it included as a fun easter egg for anyone reading the responses.
