import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

/**
 * Runs `fn` inside a Serializable transaction.
 *
 * Serializable is required wherever a read informs a subsequent write
 * (check-then-act), because READ COMMITTED lets two concurrent callers both
 * observe the pre-write state. The loser of such a race fails with P2034,
 * which `errorHandler` maps to 409.
 */
export function serializable(fn) {
  return prisma.$transaction(fn, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}
