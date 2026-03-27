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
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
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
- Pass context to services: `{ isAdmin: req.user?.role === 'ADMIN', userId: req.user?.id }`.
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
- Common codes: `NOT_FOUND` (404), `BAD_REQUEST` (400), `CONFLICT` (409), `UNPROCESSABLE_ENTITY` (422).

## ES Modules

- All imports use `.js` extension: `import { prisma } from '../config/prisma.js';`
- Named exports for services and controllers. Default export for Router.

## Pagination

```js
import {
  buildPaginationQuery,
  buildPaginationMeta,
} from "../utils/pagination.js";

const { skip, take, orderBy, page, pageSize } = buildPaginationQuery({
  ...req.query,
  allowedSortFields: ["name", "createdAt"],
});
const [items, totalCount] = await Promise.all([
  prisma.item.findMany({ where, skip, take, orderBy }),
  prisma.item.count({ where }),
]);
res.json({
  data: items,
  meta: buildPaginationMeta(page, pageSize, totalCount),
});
```

## Soft-Delete

Prisma auto-filters `deletedAt IS NULL` on all queries. To include deleted records, pass `{ includeDeleted: true }`.

## API Reference

See [backend/docs/system-spec-backend.md](../../docs/system-spec-backend.md) for full endpoint reference, business rules, error codes, and response shapes.
