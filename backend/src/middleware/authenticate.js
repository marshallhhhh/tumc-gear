import { Prisma } from "@prisma/client";
import { jwtVerify } from "jose";
import { env } from "../config/env.js";
import { JWKS } from "../config/jwks.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Missing or invalid authorization header.",
      ),
    );
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    }));
  } catch {
    return next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token."));
  }

  try {
    const userId = payload.sub;
    const email = payload.email;
    const fullName = payload.user_metadata?.full_name;

    let user = await prisma.user.findUnique({
      where: { id: userId },
      includeDeleted: true,
    });

    if (!user) {
      if (!fullName) {
        return next(
          new AppError(
            403,
            "PROFILE_INCOMPLETE",
            "User profile is incomplete - full name is required.",
          ),
        );
      }
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            email,
            fullName,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          // `meta.target` is an array of field names for Prisma-managed
          // constraints and an index name string for the manual partial indexes.
          const target = String(err.meta?.target ?? "");

          if (target.includes("email")) {
            // A different live Supabase identity already holds this address.
            // This is a real conflict, not a race, and retrying cannot fix it.
            return next(
              new AppError(
                409,
                "CONFLICT",
                "This email address is already registered to another account. Please contact an administrator.",
              ),
            );
          }

          // Concurrent request already created this user — re-fetch. Must match
          // the lookup above so a soft-deleted row is rejected below rather than
          // being filtered out and dereferenced as null.
          user = await prisma.user.findUnique({
            where: { id: userId },
            includeDeleted: true,
          });
        } else {
          throw err;
        }
      }
    }

    if (!user) {
      return next(
        new AppError(
          500,
          "INTERNAL_ERROR",
          "Failed to provision user account.",
        ),
      );
    }

    if (user.deletedAt || !user.isActive) {
      return next(
        new AppError(401, "UNAUTHORIZED", "Account is inactive or deleted."),
      );
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError(500, "INTERNAL_ERROR", "Internal server error."));
  }
}
