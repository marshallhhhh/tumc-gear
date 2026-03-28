import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import * as ctrl from "../controllers/loans.js";

const router = Router();

const createSchema = z.object({
  itemId: z.uuid(),
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

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z
      .enum(["dueDate", "status", "createdAt", "checkoutDate"])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    userId: z.uuid().optional(),
    itemId: z.uuid().optional(),
    status: z.enum(["ACTIVE", "RETURNED", "CANCELLED"]).optional(),
    overdue: z.enum(["true", "false"]).optional(),
  })
  .strict();

const overdueQuerySchema = z
  .object({
    userId: z.uuid().optional(),
    itemId: z.uuid().optional(),
  })
  .strict();

router.post(
  "/",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
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
router.get(
  "/overdue",
  authenticate,
  requireRole("ADMIN"),
  validate(overdueQuerySchema, "query"),
  ctrl.overdue,
);
const myLoansQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z
      .enum(["dueDate", "status", "createdAt", "checkoutDate"])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    status: z.enum(["ACTIVE", "RETURNED", "CANCELLED"]).optional(),
  })
  .strict();

router.get(
  "/my",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(myLoansQuerySchema, "query"),
  ctrl.myLoans,
);
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
