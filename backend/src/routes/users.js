import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import * as ctrl from "../controllers/users.js";

const router = Router();

const updateMeSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
});

const adminUpdateSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.email().optional(),
  role: z.enum(["MEMBER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(["email", "fullName", "createdAt", "role"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .strict();

router.get("/me", authenticate, requireRole("MEMBER", "ADMIN"), ctrl.getMe);
router.patch(
  "/me",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(updateMeSchema),
  ctrl.updateMe,
);
router.get("/:id", authenticate, requireRole("ADMIN"), ctrl.getById);
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(adminUpdateSchema),
  ctrl.update,
);
router.delete("/:id", authenticate, requireRole("ADMIN"), ctrl.deleteUser);
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(listQuerySchema, "query"),
  ctrl.list,
);

export default router;
