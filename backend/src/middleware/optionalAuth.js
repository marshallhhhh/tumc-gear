import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

const JWKS = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

export async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    }));
  } catch {
    return next();
  }

  try {
    const userId = payload.sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user && !user.deletedAt && user.isActive) {
      req.user = user;
    }
  } catch {
    // Silently continue without user
  }
  next();
}
