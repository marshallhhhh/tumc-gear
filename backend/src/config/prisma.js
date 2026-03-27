import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

const basePrisma = new PrismaClient({
  log: [
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});

basePrisma.$on("error", (e) => logger.error(e, "Prisma error"));
basePrisma.$on("warn", (e) => logger.warn(e, "Prisma warning"));

const softDeleteModels = ["User", "Item", "Category", "Loan", "FoundReport"];

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (softDeleteModels.includes(model) && !args.includeDeleted) {
          args.where = { ...args.where, deletedAt: null };
        }
        delete args.includeDeleted;
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (softDeleteModels.includes(model) && !args.includeDeleted) {
          args.where = { ...args.where, deletedAt: null };
        }
        delete args.includeDeleted;
        return query(args);
      },
      async findUnique({ model, args, query }) {
        if (softDeleteModels.includes(model) && !args.includeDeleted) {
          // findUnique doesn't support arbitrary where filters, so switch to findFirst
          const { where, ...rest } = args;
          delete rest.includeDeleted;
          return basePrisma[
            model.charAt(0).toLowerCase() + model.slice(1)
          ].findFirst({
            ...rest,
            where: { ...where, deletedAt: null },
          });
        }
        delete args.includeDeleted;
        return query(args);
      },
      async count({ model, args, query }) {
        if (softDeleteModels.includes(model) && !args.includeDeleted) {
          args.where = { ...args.where, deletedAt: null };
        }
        delete args.includeDeleted;
        return query(args);
      },
    },
  },
});
