import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  buildPaginationQuery,
  buildPaginationMeta,
} from "../utils/pagination.js";

export async function createFoundReport(data, userId) {
  const item = await prisma.item.findUnique({ where: { id: data.itemId } });
  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }

  // Check for duplicate open report (same item + same reporter)
  const duplicateWhere = {
    itemId: data.itemId,
    status: "OPEN",
    reportedBy: userId || null,
  };

  const existing = await prisma.foundReport.findFirst({
    where: duplicateWhere,
  });
  if (existing) {
    throw new AppError(
      409,
      "CONFLICT",
      "An open found report already exists for this item.",
    );
  }

  return prisma.foundReport.create({
    data: {
      itemId: data.itemId,
      reportedBy: userId || null,
      contactInfo: data.contactInfo || null,
      description: data.description || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    },
    include: { item: true },
  });
}

export async function listFoundReports(query) {
  const { page, pageSize, sortBy, sortOrder, itemId, status } = query;

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
    allowedSortFields: ["createdAt", "status"],
  });

  const where = {};
  if (itemId) where.itemId = itemId;
  if (status) where.status = status;

  const [reports, totalCount] = await Promise.all([
    prisma.foundReport.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: "desc" },
      include: {
        item: true,
        reporter: { select: { id: true, email: true, fullName: true } },
      },
    }),
    prisma.foundReport.count({ where }),
  ]);

  return { data: reports, ...buildPaginationMeta(p, ps, totalCount) };
}

export async function getFoundReport(id) {
  const report = await prisma.foundReport.findUnique({
    where: { id },
    include: {
      item: true,
      reporter: { select: { id: true, email: true, fullName: true } },
      closedByAdmin: { select: { id: true, email: true, fullName: true } },
    },
  });
  if (!report) {
    throw new AppError(404, "NOT_FOUND", "Found report not found.");
  }
  return report;
}

export async function closeFoundReport(id, adminId) {
  const report = await prisma.foundReport.findUnique({ where: { id } });
  if (!report) {
    throw new AppError(404, "NOT_FOUND", "Found report not found.");
  }

  if (report.status === "CLOSED") {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "This found report is already closed.",
    );
  }

  return prisma.foundReport.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: adminId,
    },
    include: { item: true },
  });
}
