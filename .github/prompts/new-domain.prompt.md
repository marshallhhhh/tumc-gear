---
description: "Scaffold a complete new domain (e.g. reservations, locations) across the full stack — Prisma model, backend route/controller/service, frontend service/hook/page."
agent: "agent"
argument-hint: "Domain name and brief description (e.g. 'reservations — track future item bookings')"
---

# Scaffold New Domain

Create a new domain across the full stack using existing patterns.

## Instructions

Read the instruction files for backend and frontend patterns before generating code:

- [Backend patterns](./../instructions/backend-api.instructions.md)
- [Frontend patterns](./../instructions/frontend-react.instructions.md)

Use the existing items domain as a reference implementation:

- Backend: `backend/src/routes/items.js`, `controllers/items.js`, `services/items.js`
- Frontend: `frontend/src/services/items.js`, `hooks/useItems.js`, `pages/admin/Items.jsx`

## Steps

1. **Prisma model** — Add model to `backend/prisma/schema.prisma`. Include `id` (UUID), timestamps, `deletedAt` if soft-deletable. Add relations and indexes.

2. **Backend service** (`backend/src/services/{domain}.js`) — CRUD functions using Prisma. Throw `AppError` for not-found and business rules. Use `buildPaginationQuery`/`buildPaginationMeta` for list endpoints.

3. **Backend controller** (`backend/src/controllers/{domain}.js`) — Thin handlers: destructure req, call service, send response. Use proper status codes (201 create, 204 delete).

4. **Backend route** (`backend/src/routes/{domain}.js`) — Define Zod schemas inline. Chain middleware: `authenticate → requireRole → validate → controller`. Export Router.

5. **Mount route** — Add to `backend/src/routes/index.js`.

6. **Frontend service** (`frontend/src/services/{domain}.js`) — Axios wrappers using `api` instance. Named exports. Unwrap `.data`.

7. **Frontend hook** (`frontend/src/hooks/use{Domain}.js`) — React Query hooks. `useQuery` for reads (staleTime 30s lists, 60s detail). `useMutation` with query invalidation on success.

8. **Frontend page** (`frontend/src/pages/admin/{Domain}.jsx`) — Admin list page using `<DataTable>`. Include loading (`<PageSkeleton>`), error (`<Alert>`), and empty states.

9. **Route registration** — Add to `frontend/src/routes/AppRouter.jsx` inside `<AdminRoute>`.

After scaffolding, run `npm run lint` in the frontend directory to verify no lint errors.
