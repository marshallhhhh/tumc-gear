import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/authenticate.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import * as ctrl from "../controllers/items.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.uuid(),
  serialNumber: z.string().max(100).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  categoryId: z.uuid().optional(),
  serialNumber: z.string().max(100).nullable().optional(),
});

const getQuerySchema = z
  .object({
    includeLoans: z.enum(["true", "false"]).optional(),
    includeFoundReports: z.enum(["true", "false"]).optional(),
  })
  .strict();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(["name", "createdAt", "updatedAt", "category"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    category: z.uuid().optional(),
    hasLoan: z.enum(["true", "false"]).optional(),
    hasQrTag: z.enum(["true", "false"]).optional(),
    search: z.string().max(200).optional(),
  })
  .strict();

/**
 * @swagger
 * /item/{id}:
 *   get:
 *     tags: [Items]
 *     summary: Get an item by ID or shortId
 *     description: |
 *       Public endpoint with optional auth. Accepts a UUID or shortId (e.g. `AUD-001`).
 *       Authenticated non-admin users receive `activeLoan` if present.
 *       Admins may opt-in to `loans[]` via `?includeLoans=true` and `foundReports[]` via `?includeFoundReports=true`.
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item UUID or shortId (e.g. `HAR-001`)
 *       - in: query
 *         name: includeLoans
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Admin only — include loan history
 *       - in: query
 *         name: includeFoundReports
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Admin only — include found reports
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", optionalAuth, validate(getQuerySchema, "query"), ctrl.get);

/**
 * @swagger
 * /item:
 *   post:
 *     tags: [Items]
 *     summary: Create an item
 *     description: Admin only. Auto-generates a shortId from the category prefix.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, categoryId]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               serialNumber:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Item created
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
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createSchema),
  ctrl.create,
);

/**
 * @swagger
 * /item/{id}:
 *   patch:
 *     tags: [Items]
 *     summary: Update an item
 *     description: Admin only. shortId is immutable.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Item UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 nullable: true
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               serialNumber:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Item updated
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
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(updateSchema),
  ctrl.update,
);

/**
 * @swagger
 * /item/{id}:
 *   delete:
 *     tags: [Items]
 *     summary: Soft-delete an item
 *     description: Admin only. Blocked if the item has an active loan.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Item UUID
 *     responses:
 *       204:
 *         description: Item deleted (no body)
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
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Item has an active loan and cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticate, requireRole("ADMIN"), ctrl.remove);

export default router;

/**
 * @swagger
 * /items:
 *   get:
 *     tags: [Items]
 *     summary: List all items (admin)
 *     description: Admin only. Paginated list with filters. Each item includes `hasActiveLoan` boolean.
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
 *           enum: [name, createdAt, updatedAt, category]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: hasLoan
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by active loan status
 *       - in: query
 *         name: hasQrTag
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by QR tag assignment
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Full-text search on item name
 *     responses:
 *       200:
 *         description: Paginated list of items
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
 *                         $ref: '#/components/schemas/ItemListItem'
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
// Separate router for GET /items (plural, admin list)
export const itemsListRouter = Router();
itemsListRouter.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(listQuerySchema, "query"),
  ctrl.list,
);
