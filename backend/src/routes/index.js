import { Router } from "express";
import categoriesRouter from "./categories.js";
import itemRouter, { itemsListRouter } from "./items.js";
import qrRouter from "./qr.js";
import loansRouter from "./loans.js";
import usersRouter from "./users.js";
import foundReportsRouter from "./foundReports.js";
import dashboardRouter from "./dashboard.js";

const router = Router();

router.use("/categories", categoriesRouter);
router.use("/item", itemRouter);
router.use("/items", itemsListRouter);
router.use("/qr", qrRouter);
router.use("/loans", loansRouter);
router.use("/users", usersRouter);
router.use("/found-reports", foundReportsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
