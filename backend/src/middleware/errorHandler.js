import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
      details: err.details,
    });
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    details: {},
  });
}
