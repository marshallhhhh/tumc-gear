---
description: "Add a single API endpoint to an existing backend domain — generates route entry, controller method, service function, and Zod schema."
agent: "agent"
argument-hint: "HTTP method, path, and purpose (e.g. 'POST /items/:id/archive — soft-archive an item')"
---

# Add API Endpoint

Add a new endpoint to an existing backend domain following the layered pattern.

## Instructions

Read the backend instruction file for code patterns:

- [Backend patterns](./../instructions/backend-api.instructions.md)
- [System spec](./../../backend/docs/system-spec-backend.md) — for existing endpoints, error codes, and business rules

## Steps

1. **Identify the domain** — Determine which existing route/controller/service file to extend.

2. **Zod schema** (if needed) — Add validation schema inline in the route file. Use `.optional()` for patch-style fields, `.nullable()` for clearable fields.

3. **Service function** — Add to `backend/src/services/{domain}.js`. Include:
   - Prisma query with appropriate `include`/`select`
   - `AppError` throws for not-found (`404`), conflicts (`409`), business-rule violations (`422`)
   - Pagination via `buildPaginationQuery`/`buildPaginationMeta` for list endpoints

4. **Controller method** — Add to `backend/src/controllers/{domain}.js`. Keep thin:

   ```js
   export async function actionName(req, res, next) {
     try {
       const result = await service.doAction(req.params.id, req.body);
       res.status(200).json(result);
     } catch (err) {
       next(err);
     }
   }
   ```

5. **Route entry** — Add to `backend/src/routes/{domain}.js` with proper middleware chain:
   - `authenticate` for protected endpoints
   - `requireRole('ADMIN')` for admin-only
   - `validate(schema)` if request has a body or query params

## Status Code Reference

| Action                  | Code |
| ----------------------- | ---- |
| Create resource         | 201  |
| Read / Update / Action  | 200  |
| Delete (soft)           | 204  |
| Validation error        | 400  |
| Uniqueness conflict     | 409  |
| Business rule violation | 422  |
