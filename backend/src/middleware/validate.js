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
    req[source] = result.data;
    next();
  };
}
