import { AppError } from "../utils/AppError.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return next(
        new AppError(400, "BAD_REQUEST", "Validation failed.", details),
      );
    }
    // Express 5 makes req.query a read-only getter; skip reassignment for query
    if (source !== "query") {
      req[source] = result.data;
    }
    next();
  };
}
