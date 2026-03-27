import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import * as ctrl from "../controllers/dashboard.js";

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), ctrl.getStats);

export default router;
