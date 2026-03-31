import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { publicRateLimiter } from "../middleware/rateLimiter.js";
import * as ctrl from "../controllers/qr.js";

const router = Router();

const resolveSchema = z.object({
  nanoid: z
    .string()
    .length(6)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

const createSchema = z.object({
  nanoid: z
    .string()
    .length(6)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

const assignSchema = z
  .object({
    nanoid: z
      .string()
      .length(6)
      .regex(/^[a-zA-Z0-9_-]+$/),
    itemId: z.uuid(),
    force: z.boolean().optional(),
    currentItemId: z.uuid().optional(),
  })
  .refine((data) => !data.force || data.currentItemId, {
    message: "currentItemId is required when force is true",
    path: ["currentItemId"],
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

/**
 * @swagger
 * /qr/resolve:
 *   post:
 *     tags: [QR Tags]
 *     summary: Resolve a QR tag to an item
 *     description: Public, rate-limited (5 req/hr per IP). Given a nanoid, returns the associated item or 404.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nanoid]
 *             properties:
 *               nanoid:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *                 example: Ab3xYz
 *     responses:
 *       200:
 *         description: Item associated with the QR tag
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: QR tag not found or not assigned to an item
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
  "/resolve",
  publicRateLimiter,
  validate(resolveSchema),
  ctrl.resolve,
);

/**
 * @swagger
 * /qr:
 *   post:
 *     tags: [QR Tags]
 *     summary: Create a QR tag
 *     description: Admin only. Creates a QR tag with the provided nanoid (6 alphanumeric chars).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nanoid]
 *             properties:
 *               nanoid:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *                 example: Ab3xYz
 *     responses:
 *       201:
 *         description: QR tag created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QrTag'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *       409:
 *         description: Nanoid already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createSchema),
  ctrl.create,
);

/**
 * @swagger
 * /qr:
 *   get:
 *     tags: [QR Tags]
 *     summary: List QR tags (admin)
 *     description: Admin only. Paginated list with optional filter by assignment status.
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
 *           enum: [createdAt, nanoid]
 *       - in: query
 *         name: assigned
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by whether the tag is assigned to an item
 *     responses:
 *       200:
 *         description: Paginated list of QR tags
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
 *                         $ref: '#/components/schemas/QrTag'
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
 * /qr/assign:
 *   post:
 *     tags: [QR Tags]
 *     summary: Assign a QR tag to an item
 *     description: |
 *       Admin only. Creates the QR tag if it doesn't exist, then assigns it to the specified item.
 *       If the tag is already assigned to a different item and `force` is not set, returns 409 with current assignment details.
 *       To force-reassign, retry with `force: true` and `currentItemId` matching the value from the error details.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nanoid, itemId]
 *             properties:
 *               nanoid:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               force:
 *                 type: boolean
 *                 description: Force-reassign from current item
 *               currentItemId:
 *                 type: string
 *                 format: uuid
 *                 description: Required when force is true — must match the tag's current itemId
 *     responses:
 *       200:
 *         description: QR tag assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QrTag'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *       409:
 *         description: QR tag already assigned to another item (details include currentItemId, currentItemName, currentItemShortId)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/assign",
  authenticate,
  requireRole("ADMIN"),
  validate(assignSchema),
  ctrl.assign,
);

/**
 * @swagger
 * /qr/{id}/assign:
 *   delete:
 *     tags: [QR Tags]
 *     summary: Unassign a QR tag from its item
 *     description: Admin only. Removes the item association. The QR tag remains in the system. Returns 422 if tag is not currently assigned.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: QR tag UUID
 *     responses:
 *       200:
 *         description: QR tag unassigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QrTag'
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
 *         description: QR tag not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: QR tag is not assigned to any item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id/assign", authenticate, requireRole("ADMIN"), ctrl.unassign);

export default router;
