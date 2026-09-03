import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { serializable } from "../utils/transaction.js";

async function generatePrefix(tx, name) {
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
  const existing = await tx.category.findMany({
    select: { prefix: true },
    includeDeleted: true,
  });
  const existingSet = new Set(existing.map((c) => c.prefix));

  // Only the third character varies, so there are exactly 26 candidates.
  // Bounded so an exhausted stem fails fast instead of spinning forever.
  for (let attempt = 0; attempt < 26; attempt++) {
    if (!existingSet.has(prefix)) {
      return prefix;
    }
    const chars = prefix.split("");
    let lastChar = chars[2].charCodeAt(0);
    lastChar = lastChar >= 90 ? 65 : lastChar + 1; // Z -> A, else increment
    chars[2] = String.fromCharCode(lastChar);
    prefix = chars.join("");
  }

  throw new AppError(
    409,
    "CONFLICT",
    "Could not generate a unique category prefix. Please choose a name with a different first two letters.",
  );
}

export async function createCategory(data) {
  // Serializable so two concurrent creates cannot both pass the name check or
  // derive the same prefix.
  return serializable(async (tx) => {
    const existing = await tx.category.findFirst({
      where: { name: data.name },
      includeDeleted: true,
    });
    if (existing) {
      throw new AppError(
        409,
        "CONFLICT",
        "A category with this name already exists.",
      );
    }

    const prefix = await generatePrefix(tx, data.name);
    return tx.category.create({ data: { name: data.name, prefix } });
  });
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function updateCategory(id, data) {
  return serializable(async (tx) => {
    const category = await tx.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError(404, "NOT_FOUND", "Category not found.");
    }

    if (data.name) {
      const duplicate = await tx.category.findFirst({
        where: { name: data.name, id: { not: id } },
        includeDeleted: true,
      });
      if (duplicate) {
        throw new AppError(
          409,
          "CONFLICT",
          "A category with this name already exists.",
        );
      }
      return tx.category.update({ where: { id }, data: { name: data.name } });
    }
    return category;
  });
}

export async function deleteCategory(id) {
  // Serializable so a category cannot be soft-deleted concurrently with an item
  // being created against it.
  await serializable(async (tx) => {
    const category = await tx.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError(404, "NOT_FOUND", "Category not found.");
    }

    const itemCount = await tx.item.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      throw new AppError(
        422,
        "UNPROCESSABLE_ENTITY",
        "Cannot delete a category that has items.",
      );
    }

    await tx.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });
}
