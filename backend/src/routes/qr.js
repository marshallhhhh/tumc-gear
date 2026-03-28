import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { publicRateLimiter } from "../middleware/rateLimiter.js";
import * as ctrl from "../controllers/qr.js";

const router = Router();

const resolveSchema = z.object({
  nanoid: z.string().length(6),
});

const createSchema = z.object({
  nanoid: z.string().length(6),
});

const assignSchema = z.object({
  nanoid: z.string().length(6),
  itemId: z.uuid(),
});

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(["createdAt", "nanoid"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    assigned: z.enum(["true", "false"]).optional(),
  })
  .strict();

router.post(
  "/resolve",
  publicRateLimiter,
  validate(resolveSchema),
  ctrl.resolve,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createSchema),
  ctrl.create,
);
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(listQuerySchema, "query"),
  ctrl.list,
);
router.post(
  "/assign",
  authenticate,
  requireRole("ADMIN"),
  validate(assignSchema),
  ctrl.assign,
);
router.delete("/:id/assign", authenticate, requireRole("ADMIN"), ctrl.unassign);

export default router;
