import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import * as ctrl from "../controllers/loans.js";

const router = Router();

const createSchema = z.object({
  itemId: z.string().uuid(),
  days: z.number().int().min(1).max(30),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const returnSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const extendSchema = z.object({
  days: z.number().int().min(1).max(30),
});

router.post(
  "/",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(createSchema),
  ctrl.create,
);
router.get("/", authenticate, requireRole("ADMIN"), ctrl.list);
router.get("/overdue", authenticate, requireRole("ADMIN"), ctrl.overdue);
router.get("/my", authenticate, requireRole("MEMBER", "ADMIN"), ctrl.myLoans);
router.post(
  "/:id/return",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(returnSchema),
  ctrl.returnLoan,
);
router.post("/:id/cancel", authenticate, requireRole("ADMIN"), ctrl.cancel);
router.patch(
  "/:id/extend",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(extendSchema),
  ctrl.extend,
);

export default router;
