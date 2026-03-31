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
    status: z
      .string()
      .optional()
      .transform((val) => val?.split(","))
      .pipe(z.array(z.enum(["ACTIVE", "RETURNED", "CANCELLED"])).optional()),
    overdue: z.enum(["true", "false"]).optional(),
  })
  .strict();

const overdueQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(["dueDate", "createdAt", "checkoutDate"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    userId: z.uuid().optional(),
    itemId: z.uuid().optional(),
  })
  .strict();

/**
 * @swagger
 * /loans:
 *   post:
 *     tags: [Loans]
 *     summary: Create a loan (checkout)
 *     description: Member or Admin. Creates an ACTIVE loan for the item. Requires geolocation. Max 30-day duration.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, days, latitude, longitude]
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
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
 *         description: Loan created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Loan'
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
 *       409:
 *         description: Item already has an active loan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Item is not available for checkout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(createSchema),
  ctrl.create,
);

/**
 * @swagger
 * /loans:
 *   get:
 *     tags: [Loans]
 *     summary: List all loans (admin)
 *     description: Admin only. Paginated with filters by userId, itemId, status, overdue.
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
 *           enum: [dueDate, status, createdAt, checkoutDate]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RETURNED, CANCELLED]
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Paginated list of loans
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
 *                         $ref: '#/components/schemas/Loan'
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
 * /loans/overdue:
 *   get:
 *     tags: [Loans]
 *     summary: List overdue loans (admin)
 *     description: Admin only. Returns active loans past their due date.
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
 *           enum: [dueDate, createdAt, checkoutDate]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Paginated list of overdue loans
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
 *                         $ref: '#/components/schemas/Loan'
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
    status: z
      .string()
      .optional()
      .transform((val) => val?.split(","))
      .pipe(z.array(z.enum(["ACTIVE", "RETURNED", "CANCELLED"])).optional()),
  })
  .strict();

/**
 * @swagger
 * /loans/my:
 *   get:
 *     tags: [Loans]
 *     summary: List current user's loans
 *     description: Member or Admin. Returns the authenticated user's loans. Supports filtering by status (comma-separated).
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
 *           enum: [dueDate, status, createdAt, checkoutDate]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated list of statuses (ACTIVE, RETURNED, CANCELLED)
 *     responses:
 *       200:
 *         description: Paginated list of the user's loans
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
 *                         $ref: '#/components/schemas/Loan'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/my",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(myLoansQuerySchema, "query"),
  ctrl.myLoans,
);

/**
 * @swagger
 * /loans/{id}/return:
 *   post:
 *     tags: [Loans]
 *     summary: Return a loan
 *     description: Member or Admin. Only the loan's borrower can return it. Requires geolocation. Sets status to RETURNED.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *     responses:
 *       200:
 *         description: Loan returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Loan'
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
 *         description: User is not the borrower of this loan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:id/return",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(returnSchema),
  ctrl.returnLoan,
);

/**
 * @swagger
 * /loans/{id}/cancel:
 *   post:
 *     tags: [Loans]
 *     summary: Cancel a loan (admin override)
 *     description: Admin only. Cancels any user's active loan. Records the cancelling admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan UUID
 *     responses:
 *       200:
 *         description: Loan cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Loan'
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
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/cancel", authenticate, requireRole("ADMIN"), ctrl.cancel);

/**
 * @swagger
 * /loans/{id}/extend:
 *   patch:
 *     tags: [Loans]
 *     summary: Extend a loan
 *     description: Member or Admin. Members can only extend their own loans; admins can extend any. Total duration cannot exceed 30 days.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [days]
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *     responses:
 *       200:
 *         description: Loan extended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Loan'
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
 *         description: Non-admin trying to extend another user's loan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Extension would exceed 30-day maximum
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/:id/extend",
  authenticate,
  requireRole("MEMBER", "ADMIN"),
  validate(extendSchema),
  ctrl.extend,
);

export default router;
