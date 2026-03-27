import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  buildPaginationQuery,
  buildPaginationMeta,
} from "../utils/pagination.js";

export async function createLoan(userId, data) {
  const { itemId, days, latitude, longitude } = data;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }

  const activeLoan = await prisma.loan.findFirst({
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

  return prisma.loan.create({
    data: {
      itemId,
      userId,
      dueDate,
      openedLatitude: latitude,
      openedLongitude: longitude,
    },
    include: { item: true },
  });
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
    where.status = status;
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
  const { userId, itemId } = query;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const where = {
    status: "ACTIVE",
    dueDate: { lt: startOfToday },
  };
  if (userId) where.userId = userId;
  if (itemId) where.itemId = itemId;

  return prisma.loan.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: {
      item: true,
      user: { select: { id: true, email: true, fullName: true } },
    },
  });
}

export async function getMyLoans(userId) {
  return prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { item: { include: { category: true } } },
  });
}

export async function returnLoan(loanId, userId, data) {
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new AppError(404, "NOT_FOUND", "Loan not found.");
  }

  if (loan.userId !== userId) {
    throw new AppError(403, "FORBIDDEN", "You can only return your own loans.");
  }

  if (loan.status !== "ACTIVE") {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "Only active loans can be returned.",
    );
  }

  return prisma.loan.update({
    where: { id: loanId },
    data: {
      status: "RETURNED",
      returnDate: new Date(),
      closedLatitude: data.latitude,
      closedLongitude: data.longitude,
    },
    include: { item: true },
  });
}

export async function cancelLoan(loanId, adminId) {
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
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

  return prisma.loan.update({
    where: { id: loanId },
    data: {
      status: "CANCELLED",
      cancelledBy: adminId,
      cancelledAt: new Date(),
    },
    include: { item: true },
  });
}

export async function extendLoan(loanId, userId, data, isAdmin = false) {
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new AppError(404, "NOT_FOUND", "Loan not found.");
  }

  if (!isAdmin && loan.userId !== userId) {
    throw new AppError(403, "FORBIDDEN", "You can only extend your own loans.");
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

  return prisma.loan.update({
    where: { id: loanId },
    data: { dueDate: newDueDate },
    include: { item: true },
  });
}
