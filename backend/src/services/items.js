import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  buildPaginationQuery,
  buildPaginationMeta,
} from "../utils/pagination.js";

async function generateShortId(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new AppError(404, "NOT_FOUND", "Category not found.");
  }

  // Find the highest existing number for this prefix across all items (including deleted)
  const items = await prisma.item.findMany({
    where: { shortId: { startsWith: `${category.prefix}-` } },
    select: { shortId: true },
    includeDeleted: true,
  });

  let maxNum = 0;
  for (const item of items) {
    const num = parseInt(item.shortId.split("-")[1], 10);
    if (num > maxNum) maxNum = num;
  }

  const next = maxNum + 1;
  const padLen = next > 999 ? 4 : 3;
  return `${category.prefix}-${String(next).padStart(padLen, "0")}`;
}

export async function createItem(data) {
  if (!data.categoryId) {
    throw new AppError(400, "BAD_REQUEST", "categoryId is required.");
  }

  const shortId = await generateShortId(data.categoryId);

  return prisma.item.create({
    data: {
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      serialNumber: data.serialNumber || null,
      shortId,
    },
    include: { category: true, qrTag: true },
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getItem(
  identifier,
  { isAdmin = false, userId, includeLoans = false, includeFoundReports = false } = {},
) {
  const where = UUID_RE.test(identifier)
    ? { id: identifier }
    : { shortId: identifier };

  const include = { category: true, qrTag: true };

  if (isAdmin && includeLoans) {
    include.loans = {
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    };
  }
  if (isAdmin && includeFoundReports) {
    include.foundReports = {
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, email: true, fullName: true } },
        closedByAdmin: { select: { id: true, email: true, fullName: true } },
      },
    };
  }

  const item = await prisma.item.findUnique({ where, include });
  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }

  // When full loans are already included, return as-is
  if (include.loans) {
    return item;
  }

  // Lightweight path: only fetch the active loan
  const activeLoan = await prisma.loan.findFirst({
    where: { itemId: item.id, status: "ACTIVE" },
    select: {
      id: true,
      userId: true,
      status: true,
      dueDate: true,
      checkoutDate: true,
    },
  });

  if (activeLoan) {
    const isOwnLoan = userId && activeLoan.userId === userId;
    return {
      ...item,
      activeLoan: isOwnLoan ? activeLoan : { status: activeLoan.status },
    };
  }

  return { ...item, activeLoan: null };
}

export async function updateItem(id, data) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.serialNumber !== undefined)
    updateData.serialNumber = data.serialNumber;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

  return prisma.item.update({
    where: { id },
    data: updateData,
    include: { category: true, qrTag: true },
  });
}

export async function deleteItem(id) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }

  const activeLoan = await prisma.loan.findFirst({
    where: { itemId: id, status: "ACTIVE" },
  });
  if (activeLoan) {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "Cannot delete an item with an active loan.",
    );
  }

  await prisma.item.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function listItems(query) {
  const {
    page,
    pageSize,
    sortBy,
    sortOrder,
    category,
    hasLoan,
    hasQrTag,
    search,
  } = query;

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
    allowedSortFields: ["name", "createdAt", "updatedAt"],
  });

  const where = {};

  if (category) {
    where.categoryId = category;
  }

  if (hasLoan === "true") {
    where.loans = { some: { status: "ACTIVE" } };
  } else if (hasLoan === "false") {
    where.loans = { none: { status: "ACTIVE" } };
  }

  if (hasQrTag === "true") {
    where.qrTag = { isNot: null };
  } else if (hasQrTag === "false") {
    where.qrTag = null;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortId: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  // Handle category sort separately
  let finalOrderBy = orderBy;
  if (sortBy === "category") {
    finalOrderBy = {
      category: { name: sortOrder === "desc" ? "desc" : "asc" },
    };
  }

  const [items, totalCount] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take,
      orderBy: finalOrderBy || { createdAt: "desc" },
      include: {
        category: true,
        qrTag: true,
        loans: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
      },
    }),
    prisma.item.count({ where }),
  ]);

  const data = items.map(({ loans, ...item }) => ({
    ...item,
    hasActiveLoan: loans.length > 0,
  }));

  return { data, ...buildPaginationMeta(p, ps, totalCount) };
}
