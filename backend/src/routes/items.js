import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import * as ctrl from "../controllers/items.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.uuid(),
  serialNumber: z.string().max(100).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  categoryId: z.uuid().optional(),
  serialNumber: z.string().max(100).nullable().optional(),
});

const getQuerySchema = z.object({
  includeLoans: z.enum(["true", "false"]).optional(),
  includeFoundReports: z.enum(["true", "false"]).optional(),
})
.strict();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(["name", "createdAt", "updatedAt", "category"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    category: z.uuid().optional(),
    hasLoan: z.enum(["true", "false"]).optional(),
    hasQrTag: z.enum(["true", "false"]).optional(),
    search: z.string().max(200).optional(),
  })
  .strict();

// GET /item/:id — public with optional auth (supports both UUID and shortId)
// e.g. /item/550e8400-... or /item/AUD-001
router.get("/:id", optionalAuth, validate(getQuerySchema, "query"), ctrl.get);

// POST /item — admin only
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createSchema),
  ctrl.create,
);

// PATCH /item/:id — admin only
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(updateSchema),
  ctrl.update,
);

// DELETE /item/:id — admin only
router.delete("/:id", authenticate, requireRole("ADMIN"), ctrl.remove);

export default router;

// Separate router for GET /items (plural, admin list)
export const itemsListRouter = Router();
itemsListRouter.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(listQuerySchema, "query"),
  ctrl.list,
);
