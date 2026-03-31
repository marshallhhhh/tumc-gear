import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  buildPaginationQuery,
  buildPaginationMeta,
} from "../utils/pagination.js";

export async function createLoan(userId, data) {
  const { itemId, days, latitude, longitude } = data;

  try {
    return await prisma.$transaction(
      async (tx) => {
        const item = await tx.item.findUnique({ where: { id: itemId } });
        if (!item) {
          throw new AppError(404, "NOT_FOUND", "Item not found.");
        }

        const activeLoan = await tx.loan.findFirst({
          where: { itemId, status: "ACTIVE" },
        });
        if (activeLoan) {
          throw new AppError(
            409,
            "CONFLICT",
            "This item already has an active loan.",
          );
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);

        return tx.loan.create({
          data: {
            itemId,
            userId,
            dueDate,
            openedLatitude: latitude,
            openedLongitude: longitude,
          },
          include: { item: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2002" || err.code === "P2034")
    ) {
      throw new AppError(
        409,
        "CONFLICT",
        "This item already has an active loan.",
      );
    }
    throw err;
  }
}

export async function listLoans(query) {
  const { page, pageSize, sortBy, sortOrder, userId, itemId, status, overdue } =
    query;

  const {
    skip,
    take,
    orderBy,
    page: p,
    pageSize: ps,
  } = buildPaginationQuery({
    page,
    pageSize,
    sortBy,
    sortOrder,
    allowedSortFields: ["dueDate", "status", "createdAt", "checkoutDate"],
  });

  const where = {};
  if (userId) where.userId = userId;
  if (itemId) where.itemId = itemId;

  if (overdue === "true") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    where.status = "ACTIVE";
    where.dueDate = { lt: startOfToday };
  } else if (status) {
    const statuses = Array.isArray(status) ? status : status.split(",");
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }

  const [loans, totalCount] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: "desc" },
      include: {
        item: true,
        user: { select: { id: true, email: true, fullName: true } },
      },
    }),
    prisma.loan.count({ where }),
  ]);

  return { data: loans, ...buildPaginationMeta(p, ps, totalCount) };
}

export async function listOverdueLoans(query) {
  const { page, pageSize, sortBy, sortOrder, userId, itemId } = query;

  const {
    skip,
    take,
    orderBy,
    page: p,
    pageSize: ps,
  } = buildPaginationQuery({
    page,
    pageSize,
    sortBy,
    sortOrder,
    allowedSortFields: ["dueDate", "createdAt", "checkoutDate"],
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const where = {
    status: "ACTIVE",
    dueDate: { lt: startOfToday },
  };
  if (userId) where.userId = userId;
  if (itemId) where.itemId = itemId;

  const [loans, totalCount] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { dueDate: "asc" },
      include: {
        item: true,
        user: { select: { id: true, email: true, fullName: true } },
      },
    }),
    prisma.loan.count({ where }),
  ]);

  return { data: loans, ...buildPaginationMeta(p, ps, totalCount) };
}

export async function getMyLoans(userId, query = {}) {
  const { page, pageSize, sortBy, sortOrder, status } = query;

  const {
    skip,
    take,
    orderBy,
    page: p,
    pageSize: ps,
  } = buildPaginationQuery({
    page,
    pageSize,
    sortBy,
    sortOrder,
    allowedSortFields: ["dueDate", "status", "createdAt", "checkoutDate"],
  });

  const where = { userId };
  if (status) {
    const statuses = Array.isArray(status) ? status : status.split(",");
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }

  const [loans, totalCount] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: "desc" },
      include: { item: { include: { category: true } } },
    }),
    prisma.loan.count({ where }),
  ]);

  return { data: loans, ...buildPaginationMeta(p, ps, totalCount) };
}

export async function returnLoan(loanId, userId, data) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const loan = await tx.loan.findUnique({ where: { id: loanId } });
        if (!loan) {
          throw new AppError(404, "NOT_FOUND", "Loan not found.");
        }

        if (loan.userId !== userId) {
          throw new AppError(
            403,
            "FORBIDDEN",
            "You can only return your own loans.",
          );
        }

        if (loan.status !== "ACTIVE") {
          throw new AppError(
            422,
            "UNPROCESSABLE_ENTITY",
            "Only active loans can be returned.",
          );
        }

        return tx.loan.update({
          where: { id: loanId },
          data: {
            status: "RETURNED",
            returnDate: new Date(),
            closedLatitude: data.latitude,
            closedLongitude: data.longitude,
          },
          include: { item: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2034"
    ) {
      throw new AppError(
        409,
        "CONFLICT",
        "Concurrent update detected. Please retry.",
      );
    }
    throw err;
  }
}

export async function cancelLoan(loanId, adminId) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const loan = await tx.loan.findUnique({ where: { id: loanId } });
        if (!loan) {
          throw new AppError(404, "NOT_FOUND", "Loan not found.");
        }

        if (loan.status !== "ACTIVE") {
          throw new AppError(
            422,
            "UNPROCESSABLE_ENTITY",
            "Only active loans can be cancelled.",
          );
        }

        return tx.loan.update({
          where: { id: loanId },
          data: {
            status: "CANCELLED",
            cancelledBy: adminId,
            cancelledAt: new Date(),
          },
          include: { item: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2034"
    ) {
      throw new AppError(
        409,
        "CONFLICT",
        "Concurrent update detected. Please retry.",
      );
    }
    throw err;
  }
}

export async function extendLoan(loanId, userId, data, isAdmin = false) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const loan = await tx.loan.findUnique({ where: { id: loanId } });
        if (!loan) {
          throw new AppError(404, "NOT_FOUND", "Loan not found.");
        }

        if (!isAdmin && loan.userId !== userId) {
          throw new AppError(
            403,
            "FORBIDDEN",
            "You can only extend your own loans.",
          );
        }

        if (loan.status !== "ACTIVE") {
          throw new AppError(
            422,
            "UNPROCESSABLE_ENTITY",
            "Only active loans can be extended.",
          );
        }

        // Calculate total duration from checkout to proposed new due date
        const newDueDate = new Date(loan.dueDate);
        newDueDate.setDate(newDueDate.getDate() + data.days);

        const maxDueDate = new Date(loan.checkoutDate);
        maxDueDate.setDate(maxDueDate.getDate() + 30);

        if (newDueDate > maxDueDate) {
          throw new AppError(
            422,
            "UNPROCESSABLE_ENTITY",
            "Loan extension would exceed the 30-day maximum.",
          );
        }

        return tx.loan.update({
          where: { id: loanId },
          data: { dueDate: newDueDate },
          include: { item: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2034"
    ) {
      throw new AppError(
        409,
        "CONFLICT",
        "Concurrent update detected. Please retry.",
      );
    }
    throw err;
  }
}
