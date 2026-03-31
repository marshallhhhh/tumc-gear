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
  itemId: z.uuid(),
  contactInfo: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(["createdAt", "status"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    itemId: z.uuid().optional(),
    status: z.enum(["OPEN", "CLOSED"]).optional(),
  })
  .strict();

/**
 * @swagger
 * /found-reports:
 *   post:
 *     tags: [Found Reports]
 *     summary: Create a found report
 *     description: Public, rate-limited (5 req/hr per IP). Optional auth — if authenticated, the reporter is recorded. Reports a found item.
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               contactInfo:
 *                 type: string
 *                 maxLength: 500
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *     responses:
 *       201:
 *         description: Found report created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoundReport'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Duplicate open found report for same item and reporter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  publicRateLimiter,
  optionalAuth,
  validate(createSchema),
  ctrl.create,
);

/**
 * @swagger
 * /found-reports:
 *   get:
 *     tags: [Found Reports]
 *     summary: List found reports (admin)
 *     description: Admin only. Paginated list with filters by itemId and status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, status]
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED]
 *     responses:
 *       200:
 *         description: Paginated list of found reports
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationMeta'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FoundReport'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(listQuerySchema, "query"),
  ctrl.list,
);

/**
 * @swagger
 * /found-reports/{id}:
 *   get:
 *     tags: [Found Reports]
 *     summary: Get a found report (admin)
 *     description: Admin only. Returns a single found report by ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Found report UUID
 *     responses:
 *       200:
 *         description: Found report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoundReport'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Found report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authenticate, requireRole("ADMIN"), ctrl.get);

/**
 * @swagger
 * /found-reports/{id}/close:
 *   post:
 *     tags: [Found Reports]
 *     summary: Close a found report (admin)
 *     description: Admin only. Sets status to CLOSED and records the closing admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Found report UUID
 *     responses:
 *       200:
 *         description: Found report closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoundReport'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Found report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/close", authenticate, requireRole("ADMIN"), ctrl.close);

export default router;
