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

    let user = await prisma.user.findUnique({ where: { id: userId } });

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
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          fullName,
        },
      });
    }

    if (user.deletedAt || !user.isActive) {
      return next(
        new AppError(401, "UNAUTHORIZED", "Account is inactive or deleted."),
      );
    }

    req.user = user;
    next();
  } catch {
    next(new AppError(500, "INTERNAL_ERROR", "Internal server error."));
  }
}
