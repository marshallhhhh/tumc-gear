import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { serializable } from "../utils/transaction.js";
import {
  buildPaginationQuery,
  buildPaginationMeta,
} from "../utils/pagination.js";

// Valid full name: letters (including accented), spaces, hyphens, apostrophes, periods
const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F' \-.]+$/;

export async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found.");
  }
  return user;
}

export async function updateMe(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found.");
  }

  if (data.fullName && !NAME_REGEX.test(data.fullName)) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Full name must contain only letters, spaces, hyphens, apostrophes, and periods.",
    );
  }

  const updateData = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName;

  return prisma.user.update({ where: { id: userId }, data: updateData });
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      loans: {
        where: { status: "ACTIVE" },
        include: { item: true },
      },
    },
  });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found.");
  }
  return user;
}

export async function updateUser(id, data, adminId) {
  // Serializable so the email uniqueness check cannot be overtaken by a
  // concurrent write claiming the same address.
  return serializable(async (tx) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found.");
    }

    if (id === adminId && data.role && data.role !== "ADMIN") {
      throw new AppError(
        422,
        "UNPROCESSABLE_ENTITY",
        "You cannot demote your own account.",
      );
    }

    if (id === adminId && data.isActive === false) {
      throw new AppError(
        422,
        "UNPROCESSABLE_ENTITY",
        "You cannot deactivate your own account.",
      );
    }

    if (data.fullName && !NAME_REGEX.test(data.fullName)) {
      throw new AppError(
        400,
        "BAD_REQUEST",
        "Full name must contain only letters, spaces, hyphens, apostrophes, and periods.",
      );
    }

    if (data.email !== undefined && data.email !== user.email) {
      // Uniqueness is scoped to live rows by the `one_active_user_per_email`
      // partial index, so soft-deleted holders of the address do not conflict.
      const existing = await tx.user.findFirst({
        where: { email: data.email },
      });
      if (existing) {
        throw new AppError(409, "CONFLICT", "Email is already in use.");
      }
    }

    const updateData = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.lastOverdueEmailSentAt !== undefined)
      updateData.lastOverdueEmailSentAt = data.lastOverdueEmailSentAt;

    return tx.user.update({ where: { id }, data: updateData });
  });
}

export async function listUsers(query) {
  const { page, pageSize, sortBy, sortOrder } = query;

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
    allowedSortFields: ["email", "fullName", "createdAt", "role"],
  });

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      orderBy: orderBy || { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  return { data: users, ...buildPaginationMeta(p, ps, totalCount) };
}

export async function deleteUser(id, adminId) {
  if (id === adminId) {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "You cannot delete your own account.",
    );
  }

  // Serializable, and the user is re-read inside the transaction, so a loan
  // created concurrently is either cancelled here or blocks this delete.
  await serializable(async (tx) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found.");
    }

    await tx.loan.updateMany({
      where: { userId: id, status: "ACTIVE" },
      data: {
        status: "CANCELLED",
        cancelledBy: adminId,
        cancelledAt: new Date(),
      },
    });
    await tx.user.update({ where: { id }, data: { deletedAt: new Date() } });
  });
}
