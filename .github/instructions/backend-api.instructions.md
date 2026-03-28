---
applyTo: "backend/src/**"
description: "Use when editing backend Express routes, controllers, services, or middleware. Covers ESM imports, Zod validation in routes, AppError throw patterns, pagination utility, and the controller → service → Prisma layer structure."
---

# Backend API Patterns

## Layer Structure: Route → Controller → Service → Prisma

### Routes (`routes/*.js`) — Zod schemas + middleware chain

```js
import { z } from "zod/v4";
import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { publicRateLimiter } from "../middleware/rateLimiter.js";
import * as ctrl from "../controllers/things.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

// Middleware order: authenticate → requireRole → validate → controller
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createSchema),
  ctrl.create,
);
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(updateSchema),
  ctrl.update,
);
router.delete("/:id", authenticate, requireRole("ADMIN"), ctrl.remove);
router.get("/:id", authenticate, ctrl.get);

export default router;
```

- Zod schemas defined inline at top of each route file.
- Use `validate(schema)` for body (default), `validate(schema, 'query')` for query params.
- Patch schemas use `.optional()` on all fields; nullable fields add `.nullable()`.
- `requireRole(...roles)` is variadic — pass one or more roles: `requireRole("ADMIN")` or `requireRole("MEMBER", "ADMIN")`.
- `optionalAuth` — like `authenticate` but silently continues if no token is present. Used on public endpoints that optionally enrich responses for logged-in users.
- `publicRateLimiter` — 5 req/hr per IP. Apply to public endpoints (QR resolve, found reports) before any auth middleware.

### Controllers (`controllers/*.js`) — Thin, delegate to service

```js
import * as thingService from "../services/things.js";

export async function create(req, res, next) {
  try {
    const thing = await thingService.createThing(req.body);
    res.status(201).json(thing);
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const isAdmin = req.user?.role === "ADMIN";
    const thing = await thingService.getThing(req.params.id, {
      isAdmin,
      userId: req.user?.id,
    });
    res.json(thing);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await thingService.listThings(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await thingService.deleteThing(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
```

- 201 for creates, 204 for deletes, 200 (default) for gets/updates.
- Compute `isAdmin` in controller: `const isAdmin = req.user?.role === 'ADMIN'`. Pass as part of an options object to the service.
- For list endpoints, pass `req.query` directly to the service — pagination is handled in the service layer.
- Every handler wraps in `try/catch` and calls `next(err)`.

### Services (`services/*.js`) — Business logic, throw AppError

```js
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function getThing(id) {
  const thing = await prisma.thing.findUnique({ where: { id } });
  if (!thing) throw new AppError(404, "NOT_FOUND", "Thing not found.");
  return thing;
}
```

- `AppError(statusCode, errorCode, message, details = {})` — error codes are UPPER_SNAKE_CASE.
- Common codes: `NOT_FOUND` (404), `BAD_REQUEST` (400), `FORBIDDEN` (403), `CONFLICT` (409), `UNPROCESSABLE_ENTITY` (422).

## ES Modules

- All imports use `.js` extension: `import { prisma } from '../config/prisma.js';`
- Named exports for services and controllers. Default export for Router.

## Pagination (in service layer)

Pagination is handled inside service functions, not controllers. Controllers pass `req.query` to the service.

```js
import {
  buildPaginationQuery,
  buildPaginationMeta,
} from "../utils/pagination.js";

export async function listThings(query) {
  const {
    skip,
    take,
    orderBy,
    page: p,
    pageSize: ps,
  } = buildPaginationQuery({
    ...query,
    allowedSortFields: ["name", "createdAt"],
  });

  const where = {};
  // … build filters from query …

  const [items, totalCount] = await Promise.all([
    prisma.thing.findMany({ where, skip, take, orderBy }),
    prisma.thing.count({ where }),
  ]);

  return { data: items, ...buildPaginationMeta(p, ps, totalCount) };
}
```

Response shape is flat — `{ data, page, pageSize, totalCount, totalPages }`.

## Soft-Delete

Prisma auto-filters `deletedAt IS NULL` on all queries. To include deleted records, pass `{ includeDeleted: true }`.

## API Reference

See [backend/docs/system-spec-backend.md](../../docs/system-spec-backend.md) for full endpoint reference, business rules, error codes, and response shapes.
