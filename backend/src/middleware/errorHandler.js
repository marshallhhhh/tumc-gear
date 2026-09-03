import { Prisma } from "@prisma/client";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

const PRISMA_ERROR_MAP = {
  P2002: {
    statusCode: 409,
    errorCode: "CONFLICT",
    message: "A record with these values already exists.",
    details: (err) => ({ fields: err.meta?.target }),
  },
  P2034: {
    statusCode: 409,
    errorCode: "CONFLICT",
    message: "The request conflicted with a concurrent update; please retry.",
  },
  P2025: {
    statusCode: 404,
    errorCode: "NOT_FOUND",
    message: "The requested record was not found.",
  },
  P2003: {
    statusCode: 409,
    errorCode: "CONFLICT",
    message: "The request conflicts with a related record.",
  },
};

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[err.code];
    if (mapped) {
      logger.warn(
        { code: err.code, target: err.meta?.target },
        "Prisma known request error",
      );
      return res.status(mapped.statusCode).json({
        error: mapped.errorCode,
        message: mapped.message,
        details: mapped.details ? mapped.details(err) : {},
      });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.warn(
      { code: "PrismaClientValidationError" },
      "Prisma validation error",
    );
    return res.status(400).json({
      error: "BAD_REQUEST",
      message: "The request could not be processed.",
      details: {},
    });
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    details: {},
  });
}
