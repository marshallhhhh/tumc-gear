import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  buildPaginationQuery,
  buildPaginationMeta,
} from "../utils/pagination.js";

export async function resolveQr(nanoid) {
  const qrTag = await prisma.qrTag.findUnique({
    where: { nanoid },
    include: { item: { include: { category: true } } },
  });

  if (!qrTag || !qrTag.item) {
    throw new AppError(
      404,
      "NOT_FOUND",
      "QR tag not found or not assigned to an item.",
    );
  }

  return qrTag.item;
}

export async function createQrTag(nanoid) {
  const existing = await prisma.qrTag.findUnique({ where: { nanoid } });
  if (existing) {
    throw new AppError(
      409,
      "CONFLICT",
      "A QR tag with this nanoid already exists.",
    );
  }

  return prisma.qrTag.create({ data: { nanoid } });
}

export async function listQrTags(query) {
  const { page, pageSize, sortBy, sortOrder, assigned } = query;

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
    allowedSortFields: ["createdAt", "nanoid"],
  });

  const where = {};
  if (assigned === "true") {
    where.itemId = { not: null };
  } else if (assigned === "false") {
    where.itemId = null;
  }

  const [qrTags, totalCount] = await Promise.all([
    prisma.qrTag.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: "desc" },
      include: { item: true },
    }),
    prisma.qrTag.count({ where }),
  ]);

  return { data: qrTags, ...buildPaginationMeta(p, ps, totalCount) };
}

export async function assignQrTag(
  nanoid,
  itemId,
  { force = false, currentItemId = null } = {},
) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }

  // Check if item already has a QR tag
  const existingTag = await prisma.qrTag.findUnique({ where: { itemId } });
  if (existingTag) {
    throw new AppError(
      409,
      "CONFLICT",
      "This item already has a QR tag assigned.",
    );
  }

  return prisma.$transaction(async (tx) => {
    // Find or create the QR tag
    let qrTag = await tx.qrTag.findUnique({
      where: { nanoid },
      include: { item: true },
    });
    if (!qrTag) {
      qrTag = await tx.qrTag.create({ data: { nanoid } });
    }

    // If QR tag is already assigned to another item
    if (qrTag.itemId && qrTag.itemId !== itemId) {
      if (!force) {
        throw new AppError(
          409,
          "QR_ALREADY_ASSIGNED",
          "QR tag is already assigned to another item.",
          {
            currentItemId: qrTag.itemId,
            currentItemName: qrTag.item?.name,
            currentItemShortId: qrTag.item?.shortId,
          },
        );
      }

      // Optimistic concurrency: verify assignment hasn't changed
      if (currentItemId && qrTag.itemId !== currentItemId) {
        throw new AppError(
          409,
          "CONFLICT",
          "QR tag assignment has changed since you last checked.",
          {
            currentItemId: qrTag.itemId,
            currentItemName: qrTag.item?.name,
            currentItemShortId: qrTag.item?.shortId,
          },
        );
      }
    }

    return tx.qrTag.update({
      where: { id: qrTag.id },
      data: { itemId },
      include: { item: true },
    });
  });
}

export async function unassignQrTag(qrTagId) {
  const qrTag = await prisma.qrTag.findUnique({ where: { id: qrTagId } });
  if (!qrTag) {
    throw new AppError(404, "NOT_FOUND", "QR tag not found.");
  }

  if (!qrTag.itemId) {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "QR tag is not assigned to any item.",
    );
  }

  return prisma.qrTag.update({
    where: { id: qrTagId },
    data: { itemId: null },
  });
}
