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
  itemId: z.string().uuid(),
});

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
router.get("/", authenticate, requireRole("ADMIN"), ctrl.list);
router.post(
  "/assign",
  authenticate,
  requireRole("ADMIN"),
  validate(assignSchema),
  ctrl.assign,
);
router.delete("/:id/assign", authenticate, requireRole("ADMIN"), ctrl.unassign);

export default router;
