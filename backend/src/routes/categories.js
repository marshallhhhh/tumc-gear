import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import * as ctrl from "../controllers/categories.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

router.get("/", ctrl.list);
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

export default router;
