import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import router from "./routes/index.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";

const app = express();

// application set behind nginx reverse proxy
app.set("trust proxy", 1);

app.use(pinoHttp({ logger }));
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

app.use(errorHandler);

export default app;
