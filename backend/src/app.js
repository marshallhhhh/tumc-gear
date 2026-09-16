import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import router from "./routes/index.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import * as Sentry from "@sentry/node"

const app = express();

// application set behind nginx reverse proxy
app.set("trust proxy", 1);

const ALLOWED_REQUEST_HEADERS = [
  "user-agent",
  "content-type",
  "accept",
  "origin",
];

app.use(pinoHttp({ 
  logger,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,

      headers: Object.fromEntries(
        Object.entries(req.headers).filter(([key]) =>
          ALLOWED_REQUEST_HEADERS.includes(key.toLowerCase()),
        ),
      ),
    }),
  },
 }));

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  }),
);
app.use(express.json());

// only run swagger in non-prod
if (env.NODE_ENV !== "production") {
  const swaggerUi = await import("swagger-ui-express");
  const { swaggerSpec } = await import("./config/swagger.js");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(globalRateLimiter);
app.use(router);

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

export default app;
