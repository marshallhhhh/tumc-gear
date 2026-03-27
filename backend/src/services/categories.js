import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

async function generatePrefix(name) {
  const base = name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase();
  if (base.length < 3) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Category name must have at least 3 letters.",
    );
  }

  let prefix = base;
  const existing = await prisma.category.findMany({
    select: { prefix: true },
    includeDeleted: true,
  });
  const existingSet = new Set(existing.map((c) => c.prefix));

  while (existingSet.has(prefix)) {
    const chars = prefix.split("");
    let lastChar = chars[2].charCodeAt(0);
    lastChar = lastChar >= 90 ? 65 : lastChar + 1; // Z -> A, else increment
    chars[2] = String.fromCharCode(lastChar);
    prefix = chars.join("");
  }

  return prefix;
}

export async function createCategory(data) {
  const existing = await prisma.category.findFirst({
    where: { name: data.name },
  });
  if (existing) {
    throw new AppError(
      409,
      "CONFLICT",
      "A category with this name already exists.",
    );
  }

  const prefix = await generatePrefix(data.name);
  return prisma.category.create({ data: { name: data.name, prefix } });
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function updateCategory(id, data) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError(404, "NOT_FOUND", "Category not found.");
  }

  const duplicate = await prisma.category.findFirst({
    where: { name: data.name, id: { not: id } },
  });
  if (duplicate) {
    throw new AppError(
      409,
      "CONFLICT",
      "A category with this name already exists.",
    );
  }

  return prisma.category.update({ where: { id }, data: { name: data.name } });
}

export async function deleteCategory(id) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError(404, "NOT_FOUND", "Category not found.");
  }

  const itemCount = await prisma.item.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    throw new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "Cannot delete a category that has items.",
    );
  }

  await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
