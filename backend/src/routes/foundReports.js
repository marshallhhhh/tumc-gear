import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { publicRateLimiter } from "../middleware/rateLimiter.js";
import * as ctrl from "../controllers/foundReports.js";

const router = Router();

const createSchema = z.object({
  itemId: z.string().uuid(),
  contactInfo: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

router.post(
  "/",
  publicRateLimiter,
  optionalAuth,
  validate(createSchema),
  ctrl.create,
);
router.get("/", authenticate, requireRole("ADMIN"), ctrl.list);
router.get("/:id", authenticate, requireRole("ADMIN"), ctrl.get);
router.post("/:id/close", authenticate, requireRole("ADMIN"), ctrl.close);

export default router;
